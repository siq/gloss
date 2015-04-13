define([
    'vendor/jquery',
    'vendor/underscore',
    './tooltip'
], function($, _, ToolTip) {
    return ToolTip.extend({
        defaults: {
            //jquery wrapped dom element to wrap
            customName: null,
            wrapTarget: null,
            postDelay: 0,
            },
            
        create: function() {
            var self = this;
            this._super();
            var $overlay = $('<div class="overlay" style="position:absolute;left:0;right:0;top:0;bottom:0;"></div>');
            this.options.wrapTarget.wrap($('<div class="wraptarget" style="display:inline-block;position:relative;" />'));
            this.options.wrapTarget.after($overlay);
            this.set('target', $overlay);
            $overlay.on('hover', function() {
                if (self.isWrapTargetDisabled()) {
                    $overlay.css('cursor', 'default');
                } else {
                    $overlay.css('cursor', 'pointer');
                }
            });
            $overlay.on('mouseenter', function() {
                if (!self.isWrapTargetDisabled()) {
                    self.options.wrapTarget.trigger('mouseenter');
                }
            });
            $overlay.on('mouseleave', function() {
                self.options.wrapTarget.trigger('mouseleave');
            });
            $overlay.on('mousedown', function() {
                if (!self.isWrapTargetDisabled()) {
                    self.options.wrapTarget.trigger('mousedown');
                }
            });
            $overlay.on('click', function() {
                if (!self.isWrapTargetDisabled()) {
                    self.options.wrapTarget.trigger('focus');
                    self.options.wrapTarget.addClass('checked');
                    self.options.wrapTarget.trigger('click');
                }
            });
            this.update();
        },
        _initiateShow: function(event) {
            if (this.options.customName) {
                this.$node.text(this.options.customName);
            }
            if (this.isWrapTargetDisabled()) {
                this._super(event);
            }
        },
        isWrapTargetDisabled: function() {
            if (this.options.wrapTarget.is(':disabled') || this.options.wrapTarget.hasClass('disable')) {
                return true;
            } else {
                return false;
            }
        }
    });
});
