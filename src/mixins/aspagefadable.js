define([
    'vendor/jquery',
    'vendor/underscore',
    './../util/fadequeue'
], function($, _, FadeQueue) {
    return function() {
        /* *** all options refer to 'more-document-hint'
         fadeRate - rate at which hint fades in and out
         displayHintThreshold - height above document bottom to hide hint
         minOpacity - fadeDown to 0, does not apply to hover events
               maxOpacity - fade up to some opacity, does not apply to hover events
         fadeRate - determines how quickly the 'more-document-hint' fades in and out 
         */
        var fadingIn = 'in',
            fadingOut = 'out',
            fadeQueueReleased = 'released';
        
        this.fadeQueue = undefined;

        this._windowDistanceFromBottom = function() {
            return $(document).height() - ($(window).scrollTop() + $(window).height());
        };
        this._mouseDistanceFromBottom = function(e) {
            var windowY = e.pageY - $(window).scrollTop();
            var distanceFromWindowBottom = $(window).height() - windowY;
            return distanceFromWindowBottom;
        };
        this._initFade = function() {
            if ($(window).height() < this.options.hintInitializationHeight) {
                this.fadeQueue.start(fadingIn);
                return fadingIn;
            } else {
                this.fadeQueue.start(fadingOut);
                return fadingOut;
            }
        };
        this._mouseLeaveBehavior = function(e, hintHeight, winDistFromBottom) {
            var self=this;
            self.fadeQueue.release();
            if (winDistFromBottom > this.options.displayHintThreshold) {
                self.fadeQueue.fade(fadingIn);
                self.fadeQueue.outerLock(1);
                return fadingIn;
            }
            return fadingOut;
        };
        this._mouseEnterBehavior = function(e, hintHeight, winDistFromBottom) {
            this.fadeQueue.release();
            if (winDistFromBottom > this.options.displayHintThreshold) {
                if (this._mouseDistanceFromBottom(e) < hintHeight) {
                    this.fadeQueue.fade(fadingOut);
                    return fadingOut;
                }
            }
            return fadingIn;
        },
        this._mouseMoveBehavior = function(e, hintHeight, winDistFromBottom) {
            var mouseHeight = this._mouseDistanceFromBottom(e);
            if (mouseHeight < hintHeight && mouseHeight > 3) {
                this.fadeQueue.fade(fadingOut);
                this.fadeQueue.outerLock();
                return fadingOut;
            } else if (winDistFromBottom > this.options.displayHintThreshold) {
                this.fadeQueue.release();
                this.fadeQueue.fade(fadingIn);
                return fadingIn;
            } else {
                this.fadeQueue.release();
                return fadeQueueReleased;
            }
        },
        this._clickBehavior = function(e, hintHeight, winDistFromBottom) {
            if (this._mouseDistanceFromBottom(e) < hintHeight) {
                this.fadeQueue.release();
                this.fadeQueue.fade(fadingOut);
                this.fadeQueue.clockLock(this.options.fadeRate+100);
                return fadingOut;
            };
            return fadingIn;
        },
        this._pollViewPos = function(e, hintHeight, winDistFromBottom) {
            var fadeOutP = (winDistFromBottom
                            < this.options.displayHintThreshold);
            if (fadeOutP) {
                this.fadeQueue.fade(fadingOut);
                return fadingOut;
            } else {
                this.fadeQueue.fade(fadingIn);
                return fadingIn;
            }
        },
        this._textFocusBehavior = function($input, e, hintHeight) {
            var self=this,
                fadePos = $(window).height() - hintHeight,
                inputWindowTop = $input.offset().top - $(window).scrollTop(),
                // cheater val cause the top is clear
                inputIsInFade = inputWindowTop > fadePos+10,
                inputIsBelowWindow = inputWindowTop > $(window).height();
            if (inputIsInFade && !inputIsBelowWindow) {
                self.fadeQueue.release();
                self.fadeQueue.fade(fadingOut);
                self.fadeQueue.userIsInFade();
                $input.bind('blur', function() {
                    self.fadeQueue.release();
                    self.fadeQueue.userIsOffFade();
                });
            } else {
                self.fadeQueue.release();
                self.fadeQueue.userIsOffFade();
            }
        },
        this._bindFaderToInputs = _.once(function(e, hintHeight) {
            var self=this;
            _.each($('input, textarea'), function(input) {
                $(input).focus(function(e) {
                    self._textFocusBehavior($(input), e, hintHeight);
                });
                // IE8 doesn't seem to kick off an on-focus event when clicking into an element
                $(input).click(function(e) {
                    self._textFocusBehavior($(input), e, hintHeight);
                });
            });
        }),
        this._initFooterShadow = function() {
            var self = this,
                $moreDocumentHinting = $('div.more-document-hinting'),
                hintHeight = $moreDocumentHinting.height();

            this.fadeQueue = new FadeQueue(self.options.fadeRate,
                                           self.options.minOpacity,
                                           self.options.maxOpacity,
                                           "div.more-document-hinting");
            var init = this._initFade();

            if (!this.options.disableHintingEvents) {
                console.log( 'entered' );
                $('body').live('mouseleave', function(e) {
                    self._mouseLeaveBehavior(e, hintHeight, self._windowDistanceFromBottom());
                });
                $('body').live('mouseenter',function(e) {
                    self._mouseEnterBehavior(e, hintHeight, self._windowDistanceFromBottom());
                });
                $('body').live('click',function(e) {
                    var winDistFromBottom = self._windowDistanceFromBottom();
                    self._bindFaderToInputs(e, hintHeight);
                    self._clickBehavior(e, hintHeight, winDistFromBottom);
                });
                $('body').live('mousemove', _.debounce(function(e) {
                    self._mouseMoveBehavior(e, hintHeight, self._windowDistanceFromBottom());
                }, 40));
                $(window).scroll(function(e) {
                    // Make sure that scrolling doesn't occlude an input element with the hint
                    var focusedInput = $.find('input:focus, textarea:focus');
                    if (focusedInput && focusedInput[0]) {
                        self._textFocusBehavior($(focusedInput[0]), e, hintHeight);
                    }
                });
                setInterval( function() {
                    self._pollViewPos(undefined, hintHeight, self._windowDistanceFromBottom());}, 200);
            }
            return init;
        };
        this._prependTmpl = _.wrap(this._prependTmpl, function(func) {
            this.options = $.extend({},
                                    this.options,
                                    { fadeRate:300,
                                      displayHintThreshold : 50,
                                      minOpacity: 0,
                                      maxOpacity: 1.0,
                                      hintInitializationHeight: 700
                          });

            func.call(this, func);
            $('body').append( "<div class='more-document-hinting'></div>" );
            this._initFooterShadow();
        });
    };
});
