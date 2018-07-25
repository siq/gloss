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
    //         |   |               |   |   list height     Window Size = 2*limit
    //         |   |               |   |       |               |
    //         |___|_______________|___|   <---|               |
    //             |               |                           |
    //             |_______________|   <-----------------------|

    function asInfiniteScrollable(options) {
        this.defaults = $.extend({}, {
            offset: 0,
            limit: 25,
            delegate: null,
            render: 'render',
            // this is the function that will be called to load more data
            // the default will just call 'load' on the associated collection
            // Returns a deferred that resolves when the data is loaded
            load: function() {
                var collection = this.get('collection'),
                    limit   = this.get('limit'),
                    offset  = this.get('offset');
                return collection.load({
                    limit: offset+limit,
                });
            },
            // scrollFunction: function($el) {
            //     // default scroll function returns current scrollTop position
            //     var scrollTop = $el ? $el.scrollTop() : 0;
            //     return scrollTop;
            // },
        }, this.defaults, options);

        this._bindEvents = _.wrap(this._bindEvents, function(_bindEvents) {
            this._bindInfiniteScroll();
            return _bindEvents.apply(this, _.rest(arguments, 1));
        });
        this._bindInfiniteScroll = function() {
            var self     = this,
                render   = this.get('render'),
                delegate = this.get('delegate'),
                $el      = delegate ? this.$el.find(delegate) : this.$el,
                el       = $el[0],
                scrollingDown = function() {
                    return (el.scrollHeight-($el.height()*2))/2;
                },
                scrollingUp = function() {
                    return el.scrollHeight/2;
                };

            $el.on('scroll', _.debounce(function() {
                var collection,
                    limit   = self.get('limit'),
                    offset  = self.get('offset'),
                    top     = el.scrollTop === 0,
                    bottom  = el.scrollHeight - el.scrollTop === el.clientHeight ||
                        el.scrollHeight - el.scrollTop === el.clientHeight + el.clientTop,
                    isAllDataLoaded     = self._isAllDataLoaded(),
                    isFirstWindowLoaded = self._isFirstWindowLoaded(),
                    isLastWindowLoaded  = self._isLastWindowLoaded(),
                    endOfScroll         = isAllDataLoaded && isLastWindowLoaded,
                    scrollLoadDfd       = self.get('scrollLoadDfd'),
                    load                = self.get('load');

                if (top && !isFirstWindowLoaded) {
                    // handles upward scrolls to fetch local models
                    // offset can't be less than 0
                    self.set('offset', Math.max(0, offset-limit));
                    self.set('scrollFunction', scrollingUp);
                    setTimeout(function() {self[render]();}, 0);
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

//                    console.log("asinfinitescrollable.js-onScroll (!AllDataLoaded & LastWindowLoaded) - callLoad - offset: " + offset + "  limit: " + limit + 
//                    		    "  modelLength: " + collection.models.length);
                    self.set('scrollLoadDfd', load.call(self));
                } else {
                    // handles downward scrolls to fetch local models
                    offset = self.get('offset');
                    limit = self.get('limit');
                    self.set('offset', offset+limit);
                    self.set('scrollFunction', scrollingDown);
                    setTimeout(function() {self[render]();}, 0);
                }
            }, 50));
        };
        if (!this._getTotalModelCount) {
            this._getTotalModelCount = function() {
                return this.get('collection.total') || this.get('data.length') || 0;
            };
        }
        if (!this._getWindowedModels) {
            this._getWindowedModels = function() {
                var models = this.get('models') || [],
                    offset = this.get('offset'),
                    limit = this.get('limit'),
                    total = this._getTotalModelCount(),
                    startIndex,
                    endIndex;
                // Fix for defect 9224, 9227, 11611 and 11614
                // if a query request was used in order to retrieve items 
                // only 100 items where shown on the UI, the rest were ignored.
                if (models.length == total) {
                	limit = total;
                }
                // the offset can't be greater than the total-1imit
                offset = Math.min(offset, total-limit);
                // create a window that is 2*limit
                startIndex = Math.max(0, offset-limit);
                endIndex = startIndex === 0 ? limit*2 : offset+limit;
//                console.log("asinfinitescrollable.js-_getWindowedModels - startIndex: " + startIndex + "  endIndex: " + endIndex + "  limit: " + limit + "  offset: " + offset + "  total: " + total);
                return models.slice(startIndex, endIndex);
            };
        }
        if (!this._isAllDataLoaded) {
            this._isAllDataLoaded = function() {
                var models = this.get('models') || [];
                return this._getTotalModelCount() === models.length;
            };
        }
        if (!this._isFirstWindowLoaded) {
            this._isFirstWindowLoaded = function() {
                var offset = this.get('offset'),
                    limit = this.get('limit'),
                    currentWindow = Math.floor(Math.max(0, offset-limit)/limit) + 1;
                return currentWindow === 1;
            };
        }
        if (!this._isLastWindowLoaded) {
            this._isLastWindowLoaded = function() {
                var offset = this.get('offset'),
                    limit = this.get('limit'),
                    // current total of models loaded
                    total = (this.get('models') || []).length,
                    windowCount = Math.ceil(total/limit) || 1,
                    currentWindow = Math.floor(offset/limit) + 1;
                return currentWindow >= windowCount;
            };
        }
        // This is a utility function to scroll to an element within a scrollable view
        // It is not used by the base logic
        if (!this._scrollTo) {
            this._scrollTo = function($el, offsetTop) {
                var scrollY;
                offsetTop = _.isNumber(offsetTop) ? offsetTop : 250;
                // offsetTop = $el.height();
                scrollY = $el.offset().top + this.$el.scrollTop() - offsetTop;
                this.$el.scrollTop(scrollY);
//                console.log("asinfinitescrollable.js-_scrollTo - offsetTop: " + offsetTop + "  scrollY: " + scrollY);
                return this;
            };
        }
        this[this.defaults.render] = _.wrap(this[this.defaults.render], function(render) {
            var scrollFunction = this.get('scrollFunction'),
                models   = this._getWindowedModels(),
                delegate = this.get('delegate'),
                $el;
            render.call(this, models);
            // render might wipeout the dom el if we find it first so we do it after
            if (scrollFunction) {
                $el = delegate ? this.$el.find(delegate) : this.$el;
                $el.scrollTop(scrollFunction.call(this, $el));
            }
            return this;
        });
    }
    return asInfiniteScrollable;
});
