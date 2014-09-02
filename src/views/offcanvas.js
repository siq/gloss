define([
    'vendor/jquery',
    './simpleview',
    'tmpl!./offcanvas/offcanvas.mtpl',
    'css!./offcanvas/offcanvas.css'
], function ($, SimpleView, template) {
    'use strict';

    return SimpleView.extend({
        defaults: {
            title: null
        },
        template: template,

        _bindEvents: function() {
            var self = this;

            _.bindAll(this, 'hide');
            // close on escape
            $(document).on('keyup', function(evt) {
                if (evt.which === 27) {
                    self.hide();
                }
            });
            // close on of canvas click
            // TODO: the off click doens't play well when a powergrid is in view
            // .on('mouseup', function(evt) {
            //     if (!$(evt.target).closest('.off-canvas').length) {
            //         self.hide();
            //     }
            // });
            // close on a cancel i.e. form cancel
            this.on('cancel', this.hide);
            return this._super.apply(this, arguments);
        },
        close: function() {
            return this.hide.apply(this, arguments);
        },
        hide: function() {
            this._super.apply(this, arguments);
            this.trigger('hide');
        },
        open: function() {
            return this.show.apply(this, arguments);
        },
        show: function() {
            this._super.apply(this, arguments);
            this.trigger('show');
        }
    });
});
