define([
    'vendor/jquery',
    'vendor/underscore',
    './widget',
    './../util/mouse',
    './../util/fadequeue'
], function($, _, Widget, Mouse, FadeQueue) {
    "use strict";
    return Widget.extend({
        init: function() {
            console.log('entered');
            this._super.apply(this, arguments);
            /* *** all options refer to 'more-document-hint'
               fadeRate - rate at which hint fades in and out
               displayHintThreshold - height above document bottom to hide hint
               minOpacity - fadeDown to 0, does not apply to hover events
               maxOpacity - fade up to some opacity, does not apply to hover events
               fadeRate - determines how quickly the 'more-document-hint' fades in and out 
             */
            this.options = $.extend({},
                          this.options,
                          { fadeRate:200,
                            displayHintThreshold : 50,
                            minOpacity: 0,
                            maxOpacity: 0.8,
                            hintInitializationHeight: 700
                          });
        },
        create: function() {
            var self = this, $origNode;
            var hintCheckRate = 500;

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
        _initHinting: function() {
            var self = this,
                $moreDocumentHinting = $('div.more-document-hinting'),
                hintHeight = $moreDocumentHinting.height();

            var windowDistanceFromBottom = function() {
                return $(document).height() - ($(window).scrollTop() + $(window).height());
            };

            var mouseDistanceFromBottom = function(e) {
                var windowY = e.pageY - $(window).scrollTop();
                var distanceFromWindowBottom = $(window).height() - windowY;
                return distanceFromWindowBottom;
            };

            // Initialize the hinting
            var fadeQueue = new FadeQueue(
                    400,
                    self.options.minOpacity,
                    self.options.maxOpacity,
                    'div.more-document-hinting'
                );

            if($(window).height() < self.options.hintInitializationHeight) {
                fadeQueue.fade('in');
            }

            fadeQueue.start();

            $(document).live('mouseleave', function (e) {
                fadeQueue.release();
                fadeQueue.release();
                if(windowDistanceFromBottom() > self.options.displayHintThreshold) {
                    fadeQueue.fade('in');
                    console.log('here');
                    fadeQueue.outerLock();
                }
            });
            $(document).live('mouseenter', function (e) {
                if(windowDistanceFromBottom() < self.options.displayHintThreshold) {
                    fadeQueue.release();
                    fadeQueue.fade('out');
                }
            });

            $(document).live('click', function (e) {
                if(mouseDistanceFromBottom(e) < hintHeight) {
                    fadeQueue.release();
                    fadeQueue.fade('in');
                    fadeQueue.clockLock(self.options.fadeRate+100);
                }
            });

            $(document).live('mousemove', _.debounce(function(e) {
                var mouseHeight = mouseDistanceFromBottom(e);
                if(mouseHeight < hintHeight && mouseHeight > 3) {
                    fadeQueue.fade('out');
                    fadeQueue.outerLock();
                } else if (windowDistanceFromBottom() > self.options.displayHintThreshold) {
                    fadeQueue.release();
                    fadeQueue.fade('in');
                } else {
                    fadeQueue.release();
                }
            }, 20));

            setInterval(function() {
                var fadeOutP = (windowDistanceFromBottom() < self.options.displayHintThreshold);
                if(fadeOutP) {
                    fadeQueue.fade('out');
                } else {
                    fadeQueue.fade('in');
                }
            }, 200);
        },

        _prependTmpl: function() {
            var self = this,
                template = self.options.template;

            if ($.isFunction(template)) {
                template = template();
            }

            if(template !== null) {
                $('body').prepend($(template));
                $('body').append("<div class='more-document-hinting'></div>");
                this._initHinting();
            }
        }
    });
});
