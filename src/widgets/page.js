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
    './widget',
    './../util/mouse',
    './../util/fadequeue'
], function($, _, Widget, Mouse, FadeQueue) {
    "use strict";
    return Widget.extend({
        init: function() {
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
                          { fadeRate:300,
                            displayHintThreshold : 50,
                            minOpacity: 0,
                            maxOpacity: 1.0,
                            hintInitializationHeight: 700
                          });
        },
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
        _windowDistanceFromBottom: function() {
            return $(document).height() - ($(window).scrollTop() + $(window).height());
        },
        _mouseDistanceFromBottom: function(e) {
            var windowY = e.pageY - $(window).scrollTop();
            var distanceFromWindowBottom = $(window).height() - windowY;
            return distanceFromWindowBottom;
        },
        _initFade: function() {
            if ($(window).height() < this.options.hintInitializationHeight) {
                this.fadeQueue.fade('in');
            }
            this.fadeQueue.fade('out');
        },
        _mouseLeaveBehavior: function(e, hintHeight, winDistFromBottom) {
            var self=this;
            this.fadeQueue.release();
            if (winDistFromBottom > this.options.displayHintThreshold) {
                this.fadeQueue.fade('in');
                this.fadeQueue.outerLock();
            }
        },
        _mouseEnterBehavior: function(e, hintHeight, winDistFromBottom) {
            this.fadeQueue.release();
            if (winDistFromBottom > this.options.displayHintThreshold) {
                if( this._mouseDistanceFromBottom(e) < hintHeight ) {
                    this.fadeQueue.fade('out');
                }
            }
        },
        _mouseMoveBehavior: function(e, hintHeight, winDistFromBottom) {
            var mouseHeight = this._mouseDistanceFromBottom(e);
            if( mouseHeight < hintHeight && mouseHeight > 3) {
                this.fadeQueue.fade('out');
                this.fadeQueue.outerLock();
            } else if (winDistFromBottom > this.options.displayHintThreshold) {
                this.fadeQueue.release();
                this.fadeQueue.fade('in');
            } else {
                this.fadeQueue.release();
            }
        },
        _clickBehavior: function(e, hintHeight, winDistFromBottom) {
            if (this._mouseDistanceFromBottom(e) < hintHeight) {
                this.fadeQueue.release();
                this.fadeQueue.fade('out');
                this.fadeQueue.clockLock(this.options.fadeRate+100);
            };
        },
        _pollViewPos: function(e, hintHeight, winDistFromBottom) {
            var fadeOutP = (winDistFromBottom
                            < this.options.displayHintThreshold);
            if (fadeOutP) {
                this.fadeQueue.fade('out');
            } else {
                this.fadeQueue.fade('in');
            }
        },
        _initFooterShadow: function() {
            var self = this,
                $moreDocumentHinting = $('div.more-document-hinting'),
                hintHeight = $moreDocumentHinting.height();

            this.fadeQueue = new FadeQueue(self.options.fadeRate,
                                          self.options.minOpacity,
                                          self.options.maxOpacity,
                                          "div.more-document-hinting");
            this._initFade(this.fadeQueue);
            this.fadeQueue.start('in');

            if( !self.options.disableHintingEvents ) {
                $(document).live('mouseleave', function(e) {
                    self._mouseLeaveBehavior(e, hintHeight, self._windowDistanceFromBottom());
                });
                $(document).live('mouseenter',function(e) {
                    self._mouseEnterBehavior(e, hintHeight, self._windowDistanceFromBottom());
                });
                $(document).live('click',function(e) {
                    self._clickBehavior(e, hintHeight, self._windowDistanceFromBottom());
                });
                $(document).live('mousemove', _.debounce(function(e) {
                    self._mouseMoveBehavior(e, hintHeight, self._windowDistanceFromBottom());
                }, 20));
                setInterval( function() {
                    self._pollViewPos(undefined, hintHeight, self._windowDistanceFromBottom());}, 200);
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
                $('body').append( "<div class='more-document-hinting'></div>" );
                this._initFooterShadow();
            }
        }
    });
});
