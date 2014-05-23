/**
 * Author: Ralph Smith
 * Date: 4/24/12
 * Time: 11:43 AM
 * Description: Base page widget to handle prepending compiled micro
 *          templates on page load.
 */

define([
    'vendor/jquery',
    'vendor/underscore',
    './../base/widget',
    './../../util/mouse',
    './../../util/fadequeue',
    './../../mixins/aspagefadable'
], function($, _, Widget, Mouse, FadeQueue, asPageFadable) {
    "use strict";
    var Page = Widget.extend({
        create: function() {
            var self = this, $origNode;

            if (this.node.tagName.toLowerCase() !== 'body') {
                $origNode = this.$node.remove();
                this.$node = $('body');
                this.node = this.$node[0];
                this.$node.attr('id', $origNode.attr('id'));
            }

            self.load = $.Deferred();
            $(function() {
                self._prependTmpl();
                self.load.resolve();
            });
            $(document).ajaxComplete(function(evt, request, settings) {
                if(request.status===403) {
                    location.reload();
                }
            });
        },
        on: function(event, callback) {
            /* if the page is already loaded then just return
             * otherwise return a deferred object */
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

            if ($.isFunction(template)) {
                template = template();
            }
            if(template !== null) {
                $('body').prepend($(template));
            }
        }
    });
    return Page;
});
