define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'bedrock/class'
], function($, _, t, Class) {
    var isArray = _.isArray;
    
    var enableUG;

    var inBody = function($node) {
        return $node.parents('body').length > 0;
    };

    var Registry = Class.extend({
        init: function() {
            this.roots = [];
            this.widgets = {};
            this.views = {};
            //enableUG = false;
        },

        add: function(widget, parentWidget, childWidgets) {
            var id = widget.id;
            if (!this.widgets[id]) {
                this.widgets[id] = widget;
            } else {
                throw new Error('duplicate widget id: ' + id);
            }
            if (arguments.length > 1) {
                parentWidget._childWidgets.push(widget);
                widget._parentWidget = parentWidget;
                widget._childWidgets = childWidgets;
            } else if (inBody(widget.$node)) {
                this._injectWidget(widget);
            }
            if (widget._childWidgets == null) {
                widget._childWidgets = [];
            }
            widget.registry = this;
        },

        //  - get an elements child widgets and views from the registery
        childWidgetsAndViews: function(el) {
            if (!el) {
                throw Error('Registry::childWidgetsAndViews ' +
                    'requires a DOM element');
            }
            var self = this,
                children = [],
                traverse = function(el) {
                    var i, l, child, childNodes = el.childNodes, result = [];
                    for (i = 0, l = childNodes.length; i < l; i++) {
                        child = childNodes[i];
                        if (child.nodeType === 1) {
                            result.push({el: child});
                        }
                    }
                    return result;
                };
            t.dfs(traverse(el), function(node) {
                var id = node.el.id;
                if (self.isWidget(node.el)) {
                    children.push(self.toWidget(node.el));
                } else if (self.isView(node.el)) {
                    children.push(self.toView(node.el));
                } else {
                    node.children = traverse(node.el);
                }
            });
            return children;
        },

        get: function(id) {
            if (id == null) {
                return null;
            }
            if (id.target && _.isElement(id.target)) {
                id = $(id.target).attr('id');
            } else if (!_.isString(id)) {
                id = $(id).attr('id');
            } else if (id.substr(0, 1) === '#') {
                id = id.substr(1);
            }
            if (id != null) {
                return this.widgets[id];
            } else {
                return null;
            }
        },

        getByClass: function(cls) {
            var identifiedWidget = null;
            $.each(this.widgets, function(id, widget) {
                if (widget.$node.is(cls)) {
                    identifiedWidget = widget;
                    return false;
                }
            });
            return identifiedWidget;
        },

        isView: function(el) {
            return !!el.getAttribute('view-name');
        },

        isWidget: function(el) {
            return !!(this.get(el));
        },

        propagate: function(el, method) {
            var rest = Array.prototype.slice.call(arguments, 2),
                registry = instance;
            if (el) {
                _.each(registry.childWidgetsAndViews(el), function(child) {
                    if (_.isFunction(child[method])) {
                        child[method].apply(child, rest);
                    } else {
                        child.propagate.apply(child, [method].concat(rest));
                    }
                });
            }
            return this;
        },

        toView: function(el) {
            return this.views[el.getAttribute('view-name')];
        },

        toWidget: function(el) {
            return this.get(el.id);
        },

        remove: function(widget) {
            this._extractWidget(widget);
            delete widget.registry;
            delete this.widgets[widget.id];
        },

        update: function(widget, naive) {
            var currentParent = widget._parentWidget;
            if (widget.registry === undefined) {
                throw new Error('cannot update unregistered widget');
            } else if (currentParent !== undefined) {
                if (inBody(widget.$node)) {
                    var widgets = this.widgets, parent = null, changed;
                    widget.$node.parents('[id]').each(function(i, node) {
                        var widget = widgets[$(node).attr('id')];
                        if (widget != null) {
                            parent = widget;
                            return false;
                        }
                    });

                    changed = false;
                    if (currentParent !== null && parent !== null) {
                        if (currentParent.node !== parent.node) {
                            changed = true;
                        }
                    } else if (currentParent !== parent) {
                        changed = true;
                    }
                    if (changed) {
                        this._extractWidget(widget);
                        this._injectWidget(widget, parent);
                        if (!naive) {
                            this.updateWidgetNodes(widget.$node.find('[id]'), true);
                        }
                    }
                } else {
                    this._extractWidget(widget);
                    if (!naive) {
                        this.updateWidgetNodes(widget.$node.find('[id]'), true);
                    }
                }
            } else if (inBody(widget.$node)) {
                this._injectWidget(widget);
                if (!naive) {
                    this.updateWidgetNodes(widget.$node.find('[id]'), true);
                }
            }
        },

        updateWidgetNodes: function(candidates, naive) {
            var candidate, widget,
                registry = instance;
            for (var i = 0, l = candidates.length; i < l; i++) {
                candidate = candidates[i];
                if (candidate != null) {
                    if (candidate.nodeType === 1) {
                        try {
                            widget = registry.widgets[candidate.id];
                            if (widget != null) {
                                this.update(widget, naive);
                            }
                        } catch (error) {};
                    } else if (candidate.jquery || isArray(candidate)) {
                        this.updateWidgetNodes(candidate, naive);
                    }
                }
            }
        },

        _extractWidget: function(widget) {
            var parent = widget._parentWidget, container, children, child;
            container = (parent) ? parent._childWidgets : this.roots;
            container.splice($.inArray(widget, container), 1);

            children = widget._childWidgets;
            if (children != null && children.length > 0) {
                for (var i = 0, l = children.length; i < l; i++) {
                    child = children[i];
                    child._parentWidget = parent;
                    container.push(child);
                }
            }

            // delete widget._childWidgets;
            delete widget._parentWidget;
        },

        _injectWidget: function(widget, newParent) {
            var widgets = this.widgets, parent = null, children, siblings, candidates, candidate;
            if (newParent !== undefined) {
                parent = newParent;
            } else {
                widget.$node.parents('[id]').each(function(i, node) {
                    var widget = widgets[$(node).attr('id')];
                    if (widget != null) {
                        parent = widget;
                        return false;
                    }
                });
            }

            children = [];
            siblings = [widget];

            candidates = (parent) ? parent._childWidgets : this.roots;
            for (var i = 0, l = candidates.length; i < l; i++) {
                candidate = candidates[i];
                if (candidate.$node.parents('#' + widget.id).length === 1) {
                    candidate._parentWidget = widget;
                    children.push(candidate);
                } else {
                    siblings.push(candidate);
                }
            }
            if (parent) {
                parent._childWidgets = siblings;
            } else {
                this.roots = siblings;
            }

            widget._childWidgets = children;
            widget._parentWidget = parent;
        }
    });

    var instance;
    return {
        getInstance: function() {
            if (!instance) {
                // merge on window.registry just incase
                window.registry = instance = $.extend(true, window.registry || {}, Registry());
            }
            return instance;
        },
        resetInstance: function() {
            instance = null;
        }
    };
});
