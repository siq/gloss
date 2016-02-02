define([
    'vendor/jquery'
], function($) {
    'use strict';

    // the limit determines how many models will be rendered at once
    // this creates a virtual window that improves render performance
    // the virutal window size will be 2*limit after loading more data
    // generally the first render will only contain 'limit' number of models
    //
    // (1) - Note: for basic usage you will want to ensure the `render`
    //      method of your view accepts models as a parameter.
    // (2) - Note: The goal of this mixin is not to set the limit of the
    //      collection if there is one. It will increment the limit so
    //      that more models will be loaded but the ultimate goal is to
    //      provide a virutal window to improve render performance.
    //      Maybe the name should be changed.
    //
    //             _________________   <-----------------------|
    //             |               |                           |
    //             |               |                           |
    //         ____|_______________|____   <---|               |
    //         |   |               |   |       |               |
    //         |   |               |   |   list height     Window Size
    //         |   |               |   |       |               |
    //         |___|_______________|___|   <---|               |
    //             |               |                           |
    //             |_______________|   <-----------------------|

    function asInfiniteScrollable(options) {
        this.defaults = $.extend({}, this.defaults, {
            offset: 0,
            limit: 25,
            scrollFunction: function() {
                return 0;
            },
        }, options);

        this._bindEvents = _.wrap(this._bindEvents, function(_bindEvents) {
            this._bindInfiniteScroll();
            return _bindEvents.apply(this, _.rest(arguments, 1));
        });
        this._bindInfiniteScroll = function() {
            var self = this,
                scrollingDown = function() {
                    return (this.el.scrollHeight-(this.$el.height()*2))/2;
                },
                scrollingUp = function() {
                    return this.el.scrollHeight/2;
                };

            this.on('scroll', function() {
                var collection,
                    limit   = self.get('limit'),
                    offset  = self.get('offset'),
                    top     = self.el.scrollTop === 0,
                    bottom  = self.el.scrollHeight - self.el.scrollTop === self.el.clientHeight ||
                        self.el.scrollHeight - self.el.scrollTop === self.el.clientHeight + self.el.clientTop,
                    isAllDataLoaded     = self._isAllDataLoaded(),
                    isFirstWindowLoaded = self._isFirstWindowLoaded(),
                    isLastWindowLoaded  = self._isLastWindowLoaded(),
                    endOfScroll         = isAllDataLoaded && isLastWindowLoaded,
                    scrollLoadDfd       = self.get('scrollLoadDfd');

                if (top && !isFirstWindowLoaded) {
                    // handles upward scrolls to fetch local models
                    // offset can't be less than 0
                    self.set('offset', Math.max(0, offset-limit));
                    self.set('scrollFunction', scrollingUp);
                    self.render();
                    // self.$el.scrollTop(self.el.scrollHeight/2);
                } else if (top && isFirstWindowLoaded) {
                    // console.log('hit top');
                    return;
                }
                if (!bottom) {
                    return;
                }
                if (scrollLoadDfd && scrollLoadDfd.state() === 'pending' || //  - if currenlty loading then do nothing
                    self.get('models').length <= 0 ||                       // - scrolling to load 'more' data only makes sense when there is data to scroll
                    endOfScroll) {                                          //  - already loaded all the data in all windows
                    // console.log('hit bottom done');
                    return;
                } else if (!isAllDataLoaded && isLastWindowLoaded) {
                    // isAllDataLoaded = false indicates there is more to come from the server
                    // isLastWindowLoaded = true; indicates we have scrolled out all the local models
                    // and need to fetch new models from the server

                    collection = self.get('collection');
                    if (!collection) {
                        console.warn('no collection to load');
                        return;
                    }
                    limit = self.get('limit');
                    offset = self.get('offset') + limit;
                    self.set('offset', offset);
                    self.set('scrollFunction', scrollingDown);
                    scrollLoadDfd = collection.load({
                        limit: offset+limit,
                    });
                    self.set('scrollLoadDfd', scrollLoadDfd);
                } else {
                    // handles downward scrolls to fetch local models
                    offset = self.get('offset');
                    limit = self.get('limit');
                    self.set('offset', offset+limit);
                    self.set('scrollFunction', scrollingDown);
                    self.render();
                }
            });
        };
        this._getTotalModelCount = function() {
            return this.get('collection.total') || this.get('data.length') || 0;
        };
        this._getWindowedModels = function() {
            var models = this.get('models') || [],
                offset = this.get('offset'),
                limit = this.get('limit'),
                total = this._getTotalModelCount(),
                startIndex,
                endIndex;

            // the offset can't be greater than the total-1imit
            offset = Math.min(offset, total-limit);
            // create a window that is 2*limit
            startIndex = Math.max(0, offset-limit);
            endIndex = startIndex === 0 ? limit*2 : offset+limit;
            // console.log('startIndex:', startIndex);
            // console.log('endIndex:', endIndex);
            return models.slice(startIndex, endIndex);
        };
        this._isAllDataLoaded = function() {
            var models = this.get('models') || [];
            return this._getTotalModelCount() === models.length;
        };
        this._isFirstWindowLoaded = function() {
            var offset = this.get('offset'),
                limit = this.get('limit'),
                currentWindow = Math.floor(Math.max(0, offset-limit)/limit) + 1;
            return currentWindow === 1;
        };
        this._isLastWindowLoaded = function() {
            var offset = this.get('offset'),
                limit = this.get('limit'),
                // current total of models loaded
                total = (this.get('models') || []).length,
                windowCount = Math.round(total/limit) || 1,
                currentWindow = Math.floor(offset/limit) + 1;
            return windowCount === currentWindow;
        };
        // This is a utility function to scroll to an element within a scrollable view
        // It is not used by the base logic
        this._scrollTo = function($el, offsetTop) {
            var scrollY;
            offsetTop = _.isNumber(offsetTop) ? offsetTop : 250;
            // offsetTop = $el.height();
            scrollY = $el.offset().top + this.$el.scrollTop() - offsetTop;
            this.$el.scrollTop(scrollY);
            console.log(offsetTop);
            return this;
        };
        this.render = _.wrap(this.render, function(render) {
            var scrollFunction = this.get('scrollFunction'),
                models = this._getWindowedModels();
            render.call(this, models);
            this.$el.scrollTop(scrollFunction.apply(this));
            return this;
        });
    }
    return asInfiniteScrollable;
});
