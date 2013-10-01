define([
    'vendor/jquery',
    'vendor/underscore',
    './tooltip',
], function($, _, ToolTip) {
    return ToolTip.extend({
        defaults: {
            //jquery wrapped dom element to wrap
            wrapTarget: null,
            postDelay: 0,
            },
            
        create: function() {
            var self = this;
            this._super();
            var $overlay = $('<div style="position:absolute;left:0;right:0;top:0;bottom:0;"></div>')
            this.options.wrapTarget.wrap($('<div style="display:inline-block;position:relative;" />'));
            this.options.wrapTarget.after($overlay);
            this.set('target', $overlay);
            $overlay.on( "hover", function() {
                if (self.isWrapTargetDisabled())
                {
                    $overlay.css( "cursor","default");
                }
                else
                {
                    $overlay.css( "cursor","pointer");
                }
            });
            $overlay.on( "click", function() {
                self.options.wrapTarget.trigger( "click" );
            });
            this.update();
        },
        _initiateShow: function(event) {
            if (this.isWrapTargetDisabled())
            {
                this._super(event);
            }
        },
        isWrapTargetDisabled: function() {
            if (this.options.wrapTarget.is(":disabled") || this.options.wrapTarget.hasClass("disable"))
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    });
});