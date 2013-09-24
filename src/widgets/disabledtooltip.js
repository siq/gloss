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
            this.update();
        },
        _initiateShow: function(event) {
            if (this.options.wrapTarget.is(":disabled") || this.options.wrapTarget.hasClass("disable"))
            {
                this._super(event);
            }
        }
    });
});
