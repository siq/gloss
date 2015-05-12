define([
    'vendor/jquery',
    'vendor/underscore',
    './../base/widget',
    './../base/formwidget',
    './../mixins/collectionviewable',
    './menu',
    'css!./selectbox/selectbox.css'
], function($, _, Widget, FormWidget, CollectionViewable, Menu) {
    return FormWidget.extend({
        defaults: {
            entries: null,              // list of the format: [
                                        //  {content: '...', value: '...'},
                                        //  {content: '...', value: '...'},
                                        //  ...
                                        // ]

            translator: function(item) {
                return {value: item.id, content: _.escape(item.name), title: item.name};
            },

            // optionally set fixed width
            width: null
        },
        _buildMenu: function(self) {
            return Menu(self.$menu, {
                position: {my: 'left top', at: 'left bottom', of: self.$node},
                width: self,
                updateDisplay: false,
                onselect: function(event, entry) {
                    self.toggle(false);
                    if (self.entry == null || entry.value !== self.entry.value) {
                        self.setValue(_.escape(entry.value));
                    }
                }
            });
        },
        create: function() {
            var self = this, options = self.options, $replacement, disabled, num;
            this._super();

            num = this.$node.attr('data-type') === 'number'? true : false;

            self.entry = null;
            self.opened = false;

            if (options.entries == null) {
                self.$node.children().each(function(i, el) {
                    var $el = $(el),
                        entries = options.entries = options.entries || [],
                        disabled = $el.prop('disabled'),
                        entry = {
                            content: $el.text(),
                            value: num? +$el.val() : $el.val()
                        };
                    if (disabled) {
                        entry.disabled = disabled;
                    }
                    entries.push(entry);
                    if ($el.is(':selected')) {
                        self.entry = _.last(entries);
                    }
                });
            }

            disabled = self.$node.is(':disabled');

            if (self.node.tagName.toLowerCase() === 'select') {
                self.$node.replaceWith($replacement = $('<div></div>'));
                $replacement
                    .attr('name', self.$node.attr('name'))
                    .attr('data-bind', self.$node.attr('data-bind'))
                    .attr('id', self.$node.attr('id'));
                self.node = (self.$node = $replacement)[0];
            } else {
                self.$node.empty();
            }
            self.$node.addClass('selectbox');
            if (disabled) {
                self.disable();
            }

            if (self.$node.attr('tabindex') == null) {
                self.$node.attr('tabindex', 0);
            }
            self.$node.append('<span class=arrow>&#x25bc;</span>');
            self.$text = $('<span class=content></span>')
                .attr('title', self.entry && (self.entry.title || self.entry.content))
                .text(self.entry ? self.entry.content : '')
                .appendTo(self.$node);

            self.$menu = $('<div>').hide().appendTo(self.$node);
            self.menu = self._buildMenu(self);

            self.update();
            self.on('click', function(evt) {
                var $tgt = $(evt.target);
                if ($tgt.hasClass('menu') || $tgt.closest('.menu').length) {
                    return;
                }
                self.toggle();
            });
            self.on('keydown', self.onKeyEvent);
        },
        _setAutoWidth: function() {
            var w, $test = $('<div/>').addClass(this.$node.attr('class')),
                contents = _.pluck(this.options.entries, 'content');
            w = Widget.measureMinimumWidth($test, contents);
            this.$node.css({width: ''}).find('.content').width(w);
        },
        getContent: function() {
            return this.entry != null? _.escape(this.entry.content) : null;
        },
        getValue: function() {
            return this.entry != null? _.escape(this.entry.value) : null;
        },
        onKeyEvent: function(event) {
            var key = Widget.identifyKeyEvent(event),
                offset = _.indexOf(this.options.entries, this.entry);
            if(key === 'up' && offset > 0) {
                if(this.open) {

                } else {

                }
            } else if(key === 'down' && offset < (this.options.entries.length - 1)) {

            }
        },
        setValue: function(value, silent, opts) {
            var update = (opts || {}).update;
            if(!update && (this.options.entries == null || this.getValue() === value)) {
                return this;
            }
            if(!$.isPlainObject(value)) {
                value = _.find(this.options.entries, function(entry) {
                    return entry.value === value;
                });
            }
            if(value != null) {
                this.entry = value;
                this.$text
                    .attr('title', this.entry.title || this.entry.content)
                    .text(this.entry.content);
                if(!silent) {
                    this.trigger('change');
                }
            }
            return this;
        },
        toggle: function(open) {
            var self = this;
            if(typeof open !== 'boolean') {
                open = !self.opened;
            }
            if(open && !self.opened && !self.state.disabled) {
                Widget.onPageClick(self.$node, function() {
                    return self.toggle(false);
                });
                self.$node.addClass('open').find('.arrow').html('&#x25b2;');
                self.menu.show();
                self.opened = true;
            } else if(!open && self.opened) {
                self.menu.hide();
                self.$node.removeClass('open').find('.arrow').html('&#x25bc;');
                self.opened = false;
                self.node.focus();
            }
            return self;
        },
        updateWidget: function(updated) {
            var $node = this.$node, options = this.options, w;

            if (updated.initialValue && options.initialValue != null) {
                this.setValue(options.initialValue, true);
            }

            if (updated.models) {
                this.set('entries', _.map(options.models, options.translator));
            }

            if (updated.entries) {
                if (options.width == null) {
                    this._setAutoWidth();
                }

                this.menu.set('entries', options.entries);

                if (options.entries && options.entries.length) {
                    if (this.entry == null) {
                        this.setValue(options.entries[0]);
                    }
                } else {
                    this.setValue(null);
                }
            }

            if (updated.width) {
                if (options.width != null) {
                    $node.outerWidth(options.width)
                        .find('.content').css('width', '');
                } else {
                    this._setAutoWidth();
                }
            }

        }
    }, {mixins: [CollectionViewable]});
});
