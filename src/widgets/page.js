/**
 * Author: Ralph Smith
 * Date: 4/24/12
 * Time: 11:43 AM
 * Description: Base page widget to handle prepending compiled micro
 *          templates on page load.
 */

define([
    'path!vendor:jquery',
    'path!gloss:widgets/widget'
], function($, Widget) {
    return Widget.extend({
        defaults: {
            template: null
        },

        create: function() {
            var self = this;
            this._super();

            self.load = $.Deferred();
            $(function() {
                self._prependTmpl();
                self.load.resolve();
            });
        },
        on: function(event, callback) {
            /* if the page is already loaded then just return
             * otherwise return a deferred object
             */
            var self = this;
            if (event === 'load' || event === 'loaded') {
                self.load.done(callback);
            } else {
                self._super.apply(arguments);
            }
        },
        _prependTmpl: function() {
            var self = this,
                template = self.options.template;

            if(template !== null) {
                $('body').prepend($(template));
            }
        }
    });
});