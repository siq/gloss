define([
    'vendor/jquery',
    'vendor/jquery-ui',
    'vendor/underscore',
    './registry',
    './basewidget'
], function($, ui, _, Registry, BaseWidget) {
    var isPlainObject = $.isPlainObject, $extend = $.extend, slice = Array.prototype.slice;

    //  - jquery does not extend arrays on a deep copy so we are using recursiveMerge
    //  - http://forum.jquery.com/topic/jquery-extend-modifies-but-not-replaces-array-properties-on-deep-copy
    var recursiveMerge = function(original) {
        var addition, name, value;
        for (var i = 1, l = arguments.length; i < l; i++) {
            addition = arguments[i];
            if (addition != null) {
                for (name in addition) {
                    if (addition.hasOwnProperty(name)) {
                        value = addition[name];
                        if (isPlainObject(original[name]) && isPlainObject(value)) {
                            value = recursiveMerge($extend({}, original[name]), value);
                        }
                        original[name] = value;
                    }
                }
            }
        }
        return original;
    };
    
    var registry = Registry.getInstance();
    // var registry = Registry();

    $.fn.__append__ = $.fn.append;
    $.each(['after', 'append', 'before', 'prepend'], function(i, name) {
        var original = $.fn[name];
        $.fn[name] = function() {
            var retval = original.apply(this, arguments);
            registry.updateWidgetNodes(arguments);
            return retval;
        };
    });
    $.each(['appendTo', 'detach', 'insertBefore', 'insertAfter', 'prependTo', 'remove'], function(i, name) {
        var original = $.fn[name];
        $.fn[name] = function() {
            var retval = original.apply(this, arguments);
            registry.updateWidgetNodes(this);
            return retval;
        };
    });
    $.each(['replaceAll', 'replaceWith'], function(i, name) {
        var original = $.fn[name];
        $.fn[name] = function() {
            var retval = original.apply(this, arguments);
            registry.updateWidgetNodes(this);
            registry.updateWidgetNodes(arguments);
            return retval;
        };
    });

    var Widget = BaseWidget.extend({
        defaults: {
            nostyling: false,
            bindAll: true,
            bindOnMethodHandlers: true,
            populateEmptyNode: false
        },

        __new__: function(constructor, base, prototype, mixins) {
            var defaults, i, mixin;
            if (base.prototype.defaults != null && prototype.defaults != null) {
                prototype.defaults = recursiveMerge({}, base.prototype.defaults, prototype.defaults);
            }
            if (mixins) {
                for (i = mixins.length-1; i >= 0; i--) {
                    mixin = mixins[i];
                    if (mixin.__updateWidget__) {
                        if (!prototype._updateWidgetMixins) {
                            prototype._updateWidgetMixins = [];
                        }
                        prototype._updateWidgetMixins.push(mixin.__updateWidget__);
                    }
                    if (mixin.defaults) {
                        var intermediate = {},
                            addedKeys = _.difference(
                                _.keys(prototype.defaults),
                                _.keys(base.prototype.defaults)),
                            overriddenKeys = _.intersection(addedKeys, _.keys(mixin.defaults));

                        recursiveMerge(intermediate, prototype.defaults, mixin.defaults);
                        for (var k in overriddenKeys) {
                            if (overriddenKeys.hasOwnProperty(k)) {
                                if (isPlainObject(prototype.defaults[overriddenKeys[k]])) {
                                    recursiveMerge(intermediate[overriddenKeys[k]], prototype.defaults[overriddenKeys[k]]);
                                } else {
                                    intermediate[overriddenKeys[k]] = prototype.defaults[overriddenKeys[k]];
                                }
                            }
                        }
                        prototype.defaults = intermediate;
                    }
                }
            }
        },

        init: function(node, options, extension) {
            var name, value, parentWidget, $tmpl, classes, i, opts, $node;
            if (extension != null) {
                _.extend(this, extension);
            }

            this.options = opts = recursiveMerge({}, this.defaults, options);

            this._super.apply(this, arguments);

            $node = this.$node;

            this.id = $node.attr('id');
            if (this.id == null) {
                this.id = _.uniqueId('widget');
                $node.attr('id', this.id);
            }

            if (opts.bindOnMethodHandlers) {
                for (name in opts) {
                    if (opts.hasOwnProperty(name)) {
                        value = opts[name];
                        if (name.substr(0, 2) === 'on' && $.isFunction(value)) {
                            $node.on(name.substr(2).toLowerCase(), _.bind(value, this));
                        }
                    }
                }
            }

            if (opts.populateEmptyNode && !$node.children().length && node) {
                this.render();
            }
            
            if (opts.bindAll) {
                _.bindAll(this);
            }

            parentWidget = opts.parentWidget;
            delete opts.parentWidget;
            if (parentWidget) {
                registry.add(this, parentWidget, []);
            } else {
                registry.add(this);
            }

            this.create();
            this.trigger('widgetcreate', this);
        },

        create: function() {},

        destroy: function() {
            this.$node.data('widget', undefined);
            registry.remove(this);
        },

        // Widget.onPageClick([event name], callback, [opts])
        //
        // assign a callback to be executed when the user clicks anywhere
        // _outside_ of the widget.
        //
        // defaults:
        //
        //  - event: the default event is 'mousedown.onPageClick'
        //  - also by default the click is only executed once, this can be
        //    adjusted by either:
        //      - return 'false' from the callback will not cancel it, i.o.w.
        //        if you only want to cancel the callback based on a certain
        //        condition in the event context, you can return true/false.
        //        also returning nothing (undefined) is treated the same as
        //        returning true, which will cancel the callback
        //      - set opts.once to false.  if this is false then the return
        //        value doesn't matter
        //
        // examples:
        //
        //     myWidget.onPageClick(function() { /* ... */ });
        //     myWidget.onPageClick('mouseup.myHandler', function() { /* ... */ });
        //     myWidget.onPageClick(function() { /* ... */ }, {once: false});
        //     myWidget.onPageClick('click.handleIt', function() { /* ... */ }, {once: false});
        onPageClick: function(name, callback, opts) {
            var $node = this.$node;
            if (arguments.length === 1) {
                callback = name;
                name = 'mousedown.onPageClick';
                opts = {};
            } else if (arguments.length === 2 && _.isFunction(name)) {
                opts = callback;
                callback = name;
                name = 'mousedown.onPageClick';
            }
            opts = $extend({once: true}, opts);
            name += '_' + this.id;
            setTimeout(function() {
                var $doc = $(document).on(name, function handler(evt) {
                    if (evt.target !== $node[0] && !$(evt.target).closest($node).length) {
                        var ret = callback(evt),
                            returnedFalse = !ret && typeof ret !== 'undefined',
                            defaultPrevented = evt.isDefaultPrevented();

                        if (!returnedFalse && !defaultPrevented && opts.once) {
                            $doc.off(name, handler);
                        }
                    }
                });
            }, 0);
            return this;
        },

        offPageClick: function(name) {
            name = name == null? '' : '_' + name;
            $(document).off('mousedown.onPageClick_' + this.id + name);
            return this;
        },

        place: function(params) {
            var displayed = (this.$node.css('display') !== 'none'), offset;
            if (!displayed) {
                this.$node.css('visibility', 'hidden').show();
            }
            this.$node.position(params);
            if (!displayed) {
                this.$node.hide().css('visibility', 'visible');
            }
            return this;
        },

        propagate: function(method) {
            var rest = Array.prototype.slice.call(arguments, 1);
            _.each(registry.childWidgetsAndViews(this.node), function(child) {
                if (_.isFunction(child[method])) {
                    child[method].apply(child, rest);
                } else {
                    child.propagate.apply(child, [method].concat(rest));
                }
            });
            return this;
        },

        render: function(context) {
            var i, $node = this.$node,
                $tmpl = $(this._compiledHtml()),
                classes = $tmpl[0].className.split(/\s+/);
            for (i = classes.length-1; i >= 0; i--) {
                $node.addClass(classes[i]);
            }
            $node.html($tmpl.html());
        },

        set: function(name, value, opts) {
            var params;
            if (name != null) {
                if (typeof name === 'string') {
                    params = {};
                    params[name] = value;
                } else {
                    params = name;
                    opts = value;
                }
            } else {
                return this;
            }

            opts = opts || {};

            //  - jquery does not extend arrays on a deep copy so we are still using recursiveMerge
            //  - http://forum.jquery.com/topic/jquery-extend-modifies-but-not-replaces-array-properties-on-deep-copy
            recursiveMerge(this.options, params);
            if (!opts.silent) {
                this.update(params);
            }
            return this;
        },

        update: function(options) {
            var i, updated = {};
            $.each(options || this.options, function(key, value) {
                updated[key] = true;
            });
            this.updateWidget(updated);
            if (this._updateWidgetMixins) {
                for (i = this._updateWidgetMixins.length-1; i >= 0; i--) {
                    this._updateWidgetMixins[i].call(this, updated);
                }
            }
            return this;
        },

        updateWidget: function(updated) {}
    });

    Widget.attachHandler = function($node) {
        var args = slice.call(arguments, 1);
        $node.on.apply($node, args);
        return function() {
            $node.off.apply($node, args);
        };
    };

    Widget.identifyKeyEvent = function(event) {
        return {
            8: 'backspace',
            9: 'tab',
            13: 'enter',
            27: 'escape',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            42: 'delete'
        }[event.which];
    };

    Widget.measureMatchingWidth = function($node, $target) {
        var width = $target.width();
        return width + ($target.outerWidth() - width - ($node.outerWidth() - $node.width()));
    };

    Widget.measureMinimumWidth = function($testnode, values) {
        var minimum = 0, width;
        $testnode.hide().css({
            visibility: 'hidden',
            position: 'absolute',
            top: '0px',
            left: '0px'
        }).appendTo('body').show();
        for (var i = 0, l = values.length; i < l; i++) {
            $testnode.html(values[i]);
            width = $testnode.outerWidth();
            if (width > minimum) {
                minimum = width;
            }
        }
        $testnode.remove();
        return minimum;
    };

    Widget.onPageClick = function($node, callback) {
        setTimeout(function() {
            var $doc = $(document).on('mousedown.onPageClick', function handler(evt) {
                if (evt.target !== $node[0] && !$(evt.target).closest($node).length) {
                    var ret = callback(evt),
                        returnedFalse = !ret && typeof ret !== 'undefined',
                        defaultPrevented = evt.isDefaultPrevented();

                    if (!returnedFalse && !defaultPrevented) {
                        $doc.off('mousedown.onPageClick', handler);
                    }
                }
            });
        }, 0);
    };

    Widget.surrogate = function(node) {
        return function() {
            var widget = registry.get(node);
            if (widget != null) {
                return widget;
            } else {
                return BaseWidget(node);
            }
        };
    };

    Widget.registry = window.registry = registry;
    return Widget;
});
