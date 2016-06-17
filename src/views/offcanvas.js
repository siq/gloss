define([
    'vendor/jquery',
    './simpleview',
    'tmpl!./offcanvas/offcanvas.mtpl',
    'css!./offcanvas/offcanvas.css'
], function ($, SimpleView, template) {
    'use strict';

    return SimpleView.extend({
        defaults: {
            title: null,
            closeBtn: true, // 'true' to have a close button in the upper corner
            backdrop: true,
            templates: {content: ''},
        },
        template: template,

        _bindEvents: function() {
            var self = this;

            _.bindAll(this, 'hide', 'close');
            // close on escape
            // $(document).on('keyup', function(evt) {
            //     if (evt.which === 27) {
            //         self.hide();
            //     }
            // });
            $(document).on('keyup', '.off-canvas', function(evt) {
                var thisCavnas = self.el === evt.currentTarget;
                if (evt.which === 27 && thisCavnas) {
                    self.hide();
                }
            });
            this.on('transitionend', function(evt) {
                var $el = $(evt.target),
                    marginRight = $el.css('margin-right'),
                    visible = marginRight === '0px';
                if (visible) {
                    // self._focusOnFirstVisibleBinding();
                    // set focus on first focusable element
                    var _$el = $el.find('a, button, :input, [tabindex]')
                        .filter(':visible:not(":disabled"):first').focus();
                }
            });
            this.$backdrop.on('click', this.close);

            // close on of canvas click
            // TODO: the off click doens't play well when a powergrid is in view
            // .on('mouseup', function(evt) {
            //     if (!$(evt.target).closest('.off-canvas').length) {
            //         self.hide();
            //     }
            // });
            // close on a cancel i.e. form cancel
            this.on('cancel', this.hide)
                .on('click', 'h1 > .close-button', this.hide);
            return this._super.apply(this, arguments);
        },
        _focusOnFirstVisibleBinding: function() {
            var widgets = _.mpluck(this._visibleBindings(), 'widget'),
                widget = _.first(widgets),
                $el = widget && (widget.$node || widget.$el);
            if ($el && $el.is(':visible') && !$el.is(':disabled')) {
                // stupid time out for IE8 bug
                setTimeout(function() {$el.focus();}, 10);
            }
        },
        _initWidgets: function() {
            var self = this;
            this._super.apply(this, arguments);
            this.$backdrop = this.get('backdrop') ?
                $('<div class="off-canvas-backdrop hidden"></div>') : $(null);
            return this;
        },
        _visibleBindings: function() {
            var bindings = this.bindingGroup && this.bindingGroup.bindings;
            return _.filter(bindings, function(binding) {
                var $el = binding.has('widget')?
                    binding.get('widget.$node') || binding.get('widget.$el') :
                    binding.get('$el');
                return $el.is(':visible');
            });
        },
        close: function() {
            return this.hide.apply(this, arguments);
        },
        hide: function() {
            var self = this;
            this.$el.blur();
            this.$backdrop.addClass('hidden');
            this._super.apply(this, arguments);
            this.propagate('hide');
            this.trigger('hide');

            // make contained elements un-focusable on tab
            // we're waiting for the transition before resetting the visibility
            // back to the default so we still get animations
            setTimeout(function() {
                self.$el.css('visibility', 'hidden');
            }, 300);
            // let body scroll again
            $('body').css('overflow', '');
            return this;
        },
        open: function() {
            return this.show.apply(this, arguments);
        },
        show: function() {
            if (!this.$backdrop.parent().length && this.$el.parent().length) {
                this.$backdrop.insertBefore(this.$el);
            }
            // make the element focusable
            this.$el.css('visibility', 'visible');
            // don't let the body scroll
            $('body').css('overflow', 'hidden');

            this.$backdrop.removeClass('hidden');
            this._super.apply(this, arguments);
            this.propagate('show');
            this.trigger('show');
            return this;
        },
        update: function(changed) {
            var self = this;
            this._super.apply(this, arguments);
            if (changed.title) {
                this.waitForInitialRender.then(function() {
                    self.$el.find('h1').text(self.get('title'));
                });
            }
            return this;
        },
    });
});
