// TODO:
//  - edit row
//  - keyboard navigation
//  - lining up numbers based on decimal point
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/model',
    '../../views/view',
    './powergrid/columnmodel',
    './spinner',
    './../../mixins/ascollectionviewable',
    './../../util/sort',
    'tmpl!./powergrid/powergrid.mtpl',
    'tmpl!./powergrid/spinnerTr.mtpl',
    'css!./powergrid/powergrid.css'
], function($, _, model, View, ColumnModel, Spinner,
    asCollectionViewable, sort, template, loadingRowTmpl) {

    var EmptyColumnModel, PowerGrid,
        mod = /mac/i.test(navigator.userAgent)? 'metaKey' : 'ctrlKey';

    EmptyColumnModel = ColumnModel.extend({});

    PowerGrid = View.extend({
        defaults: {
            // could be true, false, or 'multi'
            selectable: false,
            // true or false
            keyboardNavigation: true,

            // things seem less buggy when we do mouseup as opposed to click
            selectableEvent: 'mouseup',

            // this is the attribute set on the model corresponding to which
            // grid row is selected. so if you want to know which model is
            // selected in a grid, you can do something like:
            //
            //     grid.get('collection').findWhere(grid.get('selectedAttr'), true);
            //
            // if this is left as 'null', then selectedAttr will be set to
            // something unique to the grid instance at instantiation time.
            //
            // this, of course, doesn't matter if 'selectable' is false
            selectedAttr: null,

            // this attribute tells the grid to load more data when scrolled to
            // the bottom of the grid
            infiniteScroll: false,
            // tell the grid how many additional models to load
            collectionLimit: null,
            increment: 50,
            windowFactor: 0
            // the windowSize determines how many models will be rendered at once
            // this creates a virtual window that improves grid render performance
            // the windowSize is a factor of the `increment` and `windowFactor`
            // windowSize = increment * windowFactor
            // **Note: if windowSize evaluates to a flasey value then all data will
            //      load without a virtual window
            //      i.e. windowFactor = 0 || null || undefined

            //             _________________   <-----------------------|
            //             |               |                           |
            //             |               |                           |
            //         ____|_______________|____   <---|               |
            //         |   |               |   |       |               |
            //         |   |               |   |   grid height     Window Size
            //         |   |               |   |       |               |
            //         |___|_______________|___|   <---|               |
            //             |               |                           |
            //             |_______________|   <-----------------------|
        },

        template: template,

        init: function() {
            var selectable, self = this;

            this._super.apply(this, arguments);

            //  - set inline table width style. we're only doing this here so it can
            //  - be removed when a column is resized.
            _.each(this.$el.find('table'), function(el) {
                $(el).css('width', '100%');
            });

            this.$tbody = this.$el.find('table.rows tbody');

            _.bindAll(this, '_onColumnChange', '_onColumnResize',
                    '_onModelChange', '_onMultiselectableRowClick',
                    '_onSelectableRowClick', '_onSearchCompleted',
                    '_onSearchCleared', 'disable', 'enable', 'rerender');

            this.on('columnchange', this._onColumnChange);
            this.on('columnresize', this._onColumnResize);

            this.set('columnModel', this.get('columnModelClass')({
                $el: this.$el.find('table.header thead'),
                grid: this
            }), {silent: true});

            if (this.get('selectedAttr') == null) {
                this.set({
                    selectedAttr: '_' + this.el.id + '_selected'
                }, {silent: true});
            }

            if ((selectable = this.get('selectable'))) {
                this.$el.addClass('selectable');
                var method = /multi/i.test(selectable)?
                    '_onMultiselectableRowClick' : '_onSelectableRowClick';
                this.on(this.get('selectableEvent'), 'tbody tr', this[method]);
            }

            this.spinnerOverlay = this.$el.find('.spinner-overlay');
            this.spinner = Spinner(null, {
                target: this.spinnerOverlay[0]
            }).appendTo(this.spinnerOverlay);

            // for testing and debugging purposes
            this._renderCount = this._renderRowCount = 0;

            this.update(_.reduce(this.options, function(m, v, k) {
                m[k] = true;
                return m;
            }, {}));

            var $header = this.$el.find('.header-wrapper'),
                $rows = this.$el.find('.row-wrapper'),
                $rowInnerWrapper = this.$rowInnerWrapper = this.$el.find('.row-inner-wrapper');
            //  - handle horizontal scroll
            $rowInnerWrapper.on('scroll', function(evt) {
                var left = parseInt($header.css('left'), 10) || 0;
                //  - check for horizontal scroll to align header and rows
                if (left !== $rowInnerWrapper.scrollLeft()) {
                    $header.css({
                        left: -$rowInnerWrapper.scrollLeft() + 'px'
                    });
                }
            });
            if (this.get('infiniteScroll')) {
                this._bindInfiniteScroll();
            }
            if (this.get('keyboardNavigation')) {
                this._bindKeyboardNavigation();
            }
        },

        _bindInfiniteScroll: function() {
            var self = this,
                $rowInnerWrapper = this.$rowInnerWrapper,
                $rowTable = this.$el.find('.rows'),
                increment = this.get('increment'),
                collection,
                limit,
                models,
                offset,
                rowHeight,
                rowTableHeight,
                trHeight,
                rowTop,
                scrollLoadDfd,
                scrollBottom,
                scrollTop;

            /* why _windowSize and not windowSize?
             *  _windowSize is calculated and cannot/must not be set directly. To adjust it use windowFactor
             * calculate _windowSize only once.
             * Pros - reduces repeated computations
             * Cons - windowSize can't be adjusted again after initial setup
             * we also use _windowSize to determine if the grid has infinite scroll and windowing enabled, reduces the
             * overhead of frequent lookups for this.get('infiniteScroll') and this.get('windowFactor') to determine
             * infinite scroll + windowing */

            this._windowSize = this.get('infiniteScroll') ? (Math.round(increment * this.get('windowFactor')) || 0):0;

            //  - handle vertical scroll for infinite scrolling
            self.on('click', '.loading-text a.reload', function() {
                self.scrollLoadSpinner.disable();
                scrollLoadDfd = self.get('collection').load({
                    reload: true
                });
            });

            $rowInnerWrapper.on('scroll', function(evt) {
                var isAllDataLoaded,
                    isLastWindowLoaded,
                    endOfScroll,
                    collection = self.get('collection');

                rowHeight = $rowInnerWrapper.height();
                rowTableHeight = $rowTable.height();
                // trHeight = $rowInnerWrapper.find('tr').first().height();
                rowTop = $rowInnerWrapper.scrollTop();
                scrollBottom = rowTableHeight - rowHeight - rowTop;

                //  - check if reached top of table for loading data from previous window(s)
                if (rowTop === 0) {
                    self.scrollHead = 'top';
                    if (self.currentWindow > 1) {
                        /*TODO: Figure out a way to calculate scrollTop to ensure scrolling is smooth*/
                        self.set('scrollTop', rowTableHeight-120);
                        self._rerender();
                    }
                }

                if (scrollBottom <= 0) {
                    /* Since windowing is no longer associated with the data layer (collections) scrolling can
                    *  affect two things
                    *  1. load new rows from the server
                    *  2. render the rows from memory
                    *  hence the need to check for `isAllDataLoaded` as well as `isLastWindowLoaded`
                    */
                    isAllDataLoaded = self._isAllDataLoaded();
                    isLastWindowLoaded = self._isLastWindowLoaded();

                    // endOfScroll = true indicates the absolute end of scrolling to the bottom. All data has been loaded
                    // from the server. The last window of rows on the client has been displayed.
                    endOfScroll = isAllDataLoaded && isLastWindowLoaded;

                    /* evaluate if we load the next set of rows or simply return, only if
                    *  a scroll-to-bottom has occured. Doing it before checking a scroll-to-bottom would result in
                    *  evaluation on each scroll
                    * `scrollBottom <= 0` should be a lot cheaper than evaluating this huge expression
                    */
                    if (!collection || //  - only valid if there is a collection
                        scrollLoadDfd && scrollLoadDfd.state() === 'pending' || //  - if currenlty loading then do nothing
                        self.get('models').length <= 0 || // - scrolling to load 'more' data only makes sense when there is data to scroll
                        endOfScroll) { //  - already loaded all the data in all windows
                        return;
                    } else if (!isAllDataLoaded && isLastWindowLoaded){
                        /* isAllDataLoaded = false indicates there is more to come from the server
                        *  self.windowsCount = 1 or isLastWindowLoaded = true; indicates we have scrolled out all the local models
                        *  and need to fetch new models from the server
                        */
                        self.scrollHead = 'bottom';
                        limit = (collection.query.params.limit || 0) + increment;
                        // scrollTop = $rowInnerWrapper.scrollTop();
                        // collection.query.params.limit = limit;
                        self.set('scrollTop', 20);
                        self.scrollLoadSpinner.disable();
                        scrollLoadDfd = collection.load({
                            limit:limit
                        }).then(function(models) {});
                    } else {
                        // handles scrolls to fetch local models
                        self.scrollHead = 'bottom';
                        self.set('scrollTop', 20);
                        self._rerender();
                    }

                }
            });
        },

        _bindKeyboardNavigation: function() {
            var self = this,
                up = 38, down = 40, enter = 13, space = 32;

            //  - We don't want the page to scroll when were trying to navigate
            //  - with the keyboard so we're going to prevent that here.
            var keys = [up, down];
            this.$el.bind('keydown', 'tbody tr', function(evt) {
                var key = evt.which;
                if(_.contains(keys, key)) {
                    evt.preventDefault();
                    return false;
                }
                return true;
            });
            this.$el.bind('keyup', 'tbody tr', function(evt) {
                var selectedModel, selectIndex, selectedTr,
                    selected = self.selected(),
                    models = self.get('models');

                //  - if we're doing multi-select and only one item is selected were good
                if (selected instanceof Array) {
                    if (selected.length !== 1) {
                        return;
                    }
                    selected = selected[0];
                }
                if (!self.$rowInnerWrapper.is(':visible') ||
                    (selected instanceof Array && selected.length > 1)) { // don't do key navigation on mutilselect
                    return;
                }
                if (evt.which === enter || evt.which === space) {      //  - enter key
                    selectedTr = self._trFromModel(selected);
                    if (selectedTr) {
                        selectedTr.trigger('dblclick');
                    }
                    return;
                } else if (evt.which === up) {             //  - up arrow
                    //  - if no row is selected select the bottom row
                    selectIndex = (selected)?
                        _.indexOf(models, selected) - 1 : models.length-1;
                } else if (evt.which === down) {      //  - down arrow
                    //  - if no row is selected select the top row
                    selectIndex = (selected)?
                        _.indexOf(models, selected) + 1 : 0;
                } else {
                    return;
                }
                selectedModel = models[selectIndex] || selected;
                if (!selectedModel) {
                    return;
                }
                self.select(selectedModel);
                self._scrollTo(selectedModel);
            });
            this.$el.bind('mouseup', function() {
                self.$el.focus();
            });
        },

        //  - this function is used to determine if all that objects in a collection have been loaded
        //  - it should be overriden in the two layer search API case
        //  - when windowing is enabled `this.get('models').length` returns only the rows
        //  - available in that window
        //  - use `collection.models.length` instead, which returns all the rows in the collection
        _isAllDataLoaded: function() {
            var collection = this.get('collection'),
                total = collection ? collection.total : 0,
                offset = collection.query.params.offset || 0,
                limit = collection.query.params.limit || 0,
                atEnd = offset + limit >= total;
            return atEnd && collection.models.length === total;
        },

         // Used to determine if the last window is loaded
        _isLastWindowLoaded: function(){
            // if _windowsSize is falsy, it means there is only 1 window which covers the whole grid.
            // so this method must return true
            return !this._windowSize || (this.currentWindow === this.windowsCount);
        },

        _isDisabled: function() {
            return this.$el.hasClass('disabled');
        },

        // in some cases we may want to disable a row
        // to maintain a data drive UI that disabled attribute should come
        // from the model but the attribute that defines what 'disabled' is
        // will change from model to model.
        // this method should be override to define what 'disabled' means
        _isModelDisabled: function(model) {
            return false;
        },

        _modelFromTr: function(tr) {
            var idx = this.$tbody.children('tr').index(tr),
                windowOffset = this._windowOffset || 0;
            return idx >= 0? this.get('models')[idx+windowOffset] : null;
        },

        _onColumnChange: function(evt, data) {
            var column = data.column, updated = data.updated;
            if (updated.sort && column.get('sort')) {
                _.each(this.get('columnModel').columns, function(c) {
                    if (c !== column && c.get('sort')) {
                        c.del('sort');
                    }
                });
                this._sort({});
            }
        },

        _onColumnResize: function(evt, data) {
            _.each(this.$el.find('table'), function(el) {
                $(el).css('width', '');
            });
            _.each(this.get('columnModel').columns, function(c) {
                c._setThCellWidth();
            });
        },

        _onModelChange: function(eventName, coll, model, changed) {
            // this is the only logical place to handle unsetting the selectedAttr
            // if a model disable property was set as defined by `_isModelDisabled`
            var selectedAttr = this.get('selectedAttr');
            if (this._isModelDisabled(model) && model.get(selectedAttr)) {
                model.set(selectedAttr, false);
            }
            this.rerender(model);
        },

        _onMultiselectableRowClick: function(evt) {
            var clickedModel = this._modelFromTr(evt.currentTarget);
            if (evt[mod] && clickedModel.get(this.get('selectedAttr'))) {
                this.unselect(clickedModel);
            } else {
                this.select(clickedModel, {
                    dontUnselectOthers: evt[mod] || evt.shiftKey,
                    selectTo: evt.shiftKey
                });
            }
        },

        _onSelectableRowClick: function(evt) {
            var clickedModel = this._modelFromTr(evt.currentTarget);
            if (clickedModel.get(this.get('selectedAttr'))) {
                return;
            }
            this.select(clickedModel);
        },

        _onSearchCompleted: function() {
            this.enable();
            this.set('gridIsFiltered', true);
        },

        _onSearchCleared: function() {
            this.enable();
            this.set('gridIsFiltered', false);
        },

        _getWindowsCount: function(models){
            var windowSize = this._windowSize,
                totalModels = models.length,
                count;

            return Math.ceil(totalModels/windowSize);
        },

        _applyWindow: function(models) {
            var windowSize,
                windowOffset,
                windowLimit,
                increment = this.get('increment'),
                scrollHead = this.scrollHead,
                collection = this.get('collection'),
                collectionLimit = collection.query.params.limit,
                $rowTable = this.$el.find('.rows'),
                currentWindow = this.currentWindow,
                totalModels = models.length;

            windowSize = this._windowSize;


            if (scrollHead == 'top') {
                // currentWindow must be >= 1
                currentWindow = Math.max(1,currentWindow-1);
            } else if(scrollHead == 'bottom'){
                // currentWindow can't be greater than the number of windows and cannot be lesser than 1
                currentWindow = Math.min(this.windowsCount, currentWindow+1);
            }

            windowLimit = Math.min(totalModels,(currentWindow) * windowSize );
            windowOffset = Math.max(0,windowLimit - windowSize);

            this.currentWindow = currentWindow;
            /* TODO : new scrollTop value cannot be the same as the previous since the viewport size is
            *  fixed. Must find a way to ensure that infinite scroll isn't a jumpy experience
            */
            this.scrollHead = scrollHead = null;
            // we use the _windowOffset value to compute trFromModel and modelFromTr
            this._windowOffset = windowOffset;
            return models.slice(windowOffset, windowLimit);
        },

        _rerender: function() {
            var i, l, rows = [],
                columns = this.get('columnModel'),
                models = this.get('models'),
                selected = this.selected();

            if (this._windowSize) {
                /* in the 1st pass currentWindow would not be set. We set this here and
                *  adjust the models in the window based on this value.
                */
                if(!this.currentWindow){
                    this.currentWindow = 1;
                }
                models = this._applyWindow(models);
            }


            var start = (new Date()).valueOf();

            if (!columns || !models) {
                return;
            }

            for (i = 0, l = models.length; i < l; i++) {
                rows.push(columns.renderTr(models[i]));
            }

            if (this.get('infiniteScroll') && rows.length) {
                rows.push(loadingRowTmpl({
                    grid: this,
                    status: this.get('collection').status,
                    text: (this._isAllDataLoaded() && this._isLastWindowLoaded()) ? 'All objects loaded' : 'Loading ...'
                }));
            }

            this.$tbody.html(rows.join(''));

            if (this.get('infiniteScroll') && rows.length) {
                //  - spinner for infinite scroll
                var $target = this.$tbody.find('.micro-spinner'),
                    scrollTarget;
                this.scrollLoadSpinner = Spinner(null, {
                    target: $target[0],
                    opts: {
                        lines: 13, // The number of lines to draw
                        length: 3, // The length of each line
                        width: 2, // The line thickness
                        radius: 3, // The radius of the inner circle
                        rotate: 0, // The rotation offset
                        color: '#000', // #rgb or #rrggbb
                        speed: 1, // Rounds per second
                        trail: 60, // Afterglow percentage
                        shadow: false, // Whether to render a shadow
                        hwaccel: false, // Whether to use hardware acceleration
                        className: 'micro-spinner', // The CSS class to assign to the spinner
                        zIndex: 2e9, // The z-index (defaults to 2000000000)
                        top: 'auto', // Top position relative to parent in px
                        left: 'auto'
                    }
                }).appendTo($target);
                this._setScrollTop();
            }

            /*if (selected &&
                (!this._windowSize || _.indexOf(models,selected) >= 0)) {
                this._scrollTo(selected);
            }*/
            // do not scroll to selected if windowing is enabled
            if (selected && !this._windowSize) {
                this._scrollTo(selected);
            }
            this._renderCount++;
        },

        _rerenderRow: function(model) {
            var currentRow = this._trFromModel(model);
            $(this.get('columnModel').renderTr(model)).insertAfter(currentRow);
            $(currentRow).remove();
            this._renderRowCount++;
            // console.log('rerendered row for', model.get('text_field'));
        },

        _scrollTo: function(model) {
            var models = this.get('models'),
                headerHeight = this.$el.find('.header-wrapper').height(),
                trHeight = this.$rowInnerWrapper.find('tr').first().height(),
                scrollTop = this.$rowInnerWrapper.scrollTop(),
                scrollTo;

            //  - if we're doing multi-select and only one item is selected were good
            if (model instanceof Array) {
                model = (model.length === 1)? model[0] : undefined;
            }
            if (!model) {
                return;
            }

            if (_.last(models) === model) {
                // - this is the last row so just scroll to the bottom
                scrollTo = this.$rowInnerWrapper.find('.rows').height();
            } else if (_.first(models) === model) {
                // - this is the first row so just scroll to the top
                scrollTo = 0;
            } else {
                /*if the previously selected model is not included in the new window,
                * don't attempt to scroll to that model
                */
                var model = this._trFromModel(model),
                    top = (model.length > 0) ? model.position().top : 0,
                    gridHeight = this.$rowInnerWrapper.height();
                if (top < trHeight) { // - row is above the grid view
                    scrollTo = scrollTop - headerHeight + top;
                } else if (top > gridHeight) { //  - row is below the grid view
                    scrollTo = scrollTop - gridHeight + top;
                }
            }
            if (typeof scrollTo === 'number' && !isNaN(scrollTo)) {
                this.$rowInnerWrapper.scrollTop(scrollTo);
            }
        },

        _setScrollTop: function() {
            var $rowInnerWrapper,
                tableHeight,
                scrollTopValue;
            if (!this.get('scrollTop')) {
                return;
            }
            $rowInnerWrapper = this.$rowInnerWrapper;

            if ($rowInnerWrapper.is(':visible')) {
                scrollTopValue = this.get('scrollTop');
                tableHeight = $rowInnerWrapper.find('table').height();
                // we don't want to set a scrollTop that triggers another load. Could result in
                // cyclic calls to load next/previous
                if (scrollTopValue > 1 && tableHeight - $rowInnerWrapper.height() - scrollTopValue >  1) {
                    $rowInnerWrapper.scrollTop(scrollTopValue);
                } else {
                    $rowInnerWrapper.scrollTop(tableHeight - $rowInnerWrapper.height()/2);
                }
                this.del('scrollTop');
            }
        },

        _sort: function(opts) {
            var ascending, models, self = this,
                column = _.find(self.get('columnModel').columns, function(c) {
                    return c.get('sort');
                });
            if (!column || !column.get('sortable') || !self.get('models')) {
                return;
            }
            // copy the models array
            // to make the sorting reproducable we need to use the `currentPage` from collection
            // if a collection is not present we just fallback to the models
            models = this.get('collection') ?
                this.get('collectionMap').call(this, this.get('collection').currentPage()) :
                this.get('models').slice(0);
            ascending = /asc/i.test(column.get('sort'));
            self.set('models',
                // sort the models array
                models.sort(function(a, b) {
                    return (ascending? 1 : -1) * sort.userFriendly(
                        column.getSortValue(a), column.getSortValue(b));
                }), opts);
        },

        _trFromModel: function(model) {
            var idx = _.indexOf(this.get('models'), model),
                windowOffset = this._windowOffset || 0,
                trIdx = idx >= windowOffset ? idx - windowOffset : idx;
            return trIdx >= 0? this.$tbody.children('tr').eq(trIdx) : null;
        },

        col: function(columnName) {
            return _.find(this.get('columnModel').columns, function(column) {
                return column.get('name') === columnName;
            });
        },

        disable: function() {
            this.$el.addClass('disabled');
            return this.propagate('disable');
        },

        enable: function() {
            this.$el.removeClass('disabled');
            return this.propagate('enable');
        },

        rerender: function() {
            var method = arguments.length > 0? '_rerenderRow' : '_rerender';

            if (this._disableRerender) {
                return;
            }

            this[method].apply(this, arguments);

            // post render for columns
            _.each(this.get('columnModel').columns, function(c) {
                c._postRender();
            });
            return this;
        },

        select: function(model, opts) {
            var indices, self = this, changes = [],
                a = self.get('selectedAttr'),
                models = self.get('models'),
                selectModels = _.isArray(model)? model : [model],
                selected = function(m) { return m.get(a); };

            opts = opts || {};

            // first just get a list of all the changes that need to happen
            if (!opts.dontUnselectOthers && !opts.selectTo) {
                _.each(models, function(m) {
                    if (_.indexOf(selectModels, m) < 0 && m.get(a)) {
                        changes.push({model: m, action: 'del'});
                    }
                });
            }

            if (opts.selectTo && _.any(models, selected)) {
                indices = _.filter([
                    _.indexOf(_.map(models, selected), true),
                    _.lastIndexOf(_.map(models, selected), true),
                    _.indexOf(models, model)
                ], function(idx) {
                    return idx >= 0;
                });
                _.each(_.range(_.min(indices), _.max(indices)), function(i) {
                    // add model to change array to set selectedAttr on model
                    // if it's no already selected an the model is not 'disabled'
                    if (!models[i].get(a) && !self._isModelDisabled(models[i])) {
                        changes.push({model: models[i], action: 'set'});
                    }
                });
            } else {
                _.each(selectModels, function(m) {
                    // add model to change array to set selectedAttr on model
                    // if it's no already selected an the model is not 'disabled'
                    if (!m.get(a) && !self._isModelDisabled(m)) {
                        changes.push({model: m, action: 'set'});
                    }
                });
            }

            // now we actually make the changes, silently for everything but
            // the last change (so no more than one change event is triggered)
            self._disableRerender = true;
            _.each(changes, function(change, i) {
                var args = [a];
                if (change.action === 'set') {
                    args.push(true);
                }
                if (i < changes.length-1) {
                    args.push({silent: true});
                }
                change.model[change.action].apply(change.model, args);
            });
            self._disableRerender = false;

            // now, if needed, re-render (some portion of) the grid
            if (changes.length > 0) {
                if (changes.length > 2) {
                    self.rerender();
                } else {
                    _.each(changes, function(change) {
                        self.rerender(change.model);
                    });
                }
                // i don't think there should be a select event for the same
                // reason i don't think we should have a grid.getSelected()
                // sort of method -- the data is the source of truth on what is
                // or isn't selected... i may come around on this tho...
                // self.trigger('select', [changed]);
            }

            return self;
        },

        selected: function() {
            var models = this.get('models'), attr = this.get('selectedAttr');
            if (this.get('selectable') === 'multi') {
                return _.filter(models, function(m) { return m.get(attr); });
            } else if (this.get('selectable')) {
                return _.find(models, function(m) { return m.get(attr); });
            }
        },

        unselect: function(model) {
            var unselectThese, unselectedLength,
                models = this.get('models'),
                a = this.get('selectedAttr'),
                unselect = model? _.isArray(model)? model : [model] : null;

            unselectThese = _.filter(models, function(m) {
                if (m.get(a)) {
                    return !unselect || _.indexOf(unselect, m) >= 0;
                }
            });

            unselectedLength = unselectThese.length;

            this._disableRerender = true;
            _.each(unselectThese, function(m, i) {
                m.del(a, {silent: i !== unselectedLength-1});
            });
            this._disableRerender = false;

            if (unselectedLength > 1) {
                this.rerender();
            } else if (unselectedLength === 1) {
                this.rerender(unselectThese[0]);
            }

            return this;
        },

        show: function() {
            var self = this;
            self._super.apply(this, arguments);
            this.spinner.instantiate();
            this._setScrollTop();
            // post render for columns
            // th width is based on td width so make sure that is set first
            _.each(this.get('columnModel').columns, function(c) {
                c._setTdCellWidth(c.get('width'));
            });
            _.each(this.get('columnModel').columns, function(c) {
                c._setThCellWidth();
            });
            return this;
        },

        update: function(updated) {
            var colName, rerender, sort, naturalWidths, collection, isFiltered,
                DummyModel, columnModel = this.get('columnModel'),
                c = function(prop) {
                    return _.find(columnModel.columns, function(column) {
                        return column.get(prop);
                    });
                };

            rerender = sort = false;

            if (updated.models) {
                rerender = sort = true;
                if(this._windowSize){
                    this.windowsCount = this._getWindowsCount(this.get('models'));
                }

            }
            if (updated.data) {
                if (!(DummyModel = this.get('DummyModel'))) {
                    this.set('DummyModel', DummyModel = model.Model.extend({}),
                            {silent: true});
                }
                this.set('models', _.map(this.get('data'), function(d) {
                    return DummyModel.models.instantiate(d);
                }));
            }
            if (updated.collection) {
                if (this.previous('collection')) {
                    this.previous('collection')
                        .off('change', this._onModelChange)
                        .off('powerGridSearchStarted', this.disable)
                        .off('powerGridSearchCompleted', this._onSearchCompleted)
                        .off('powerGridSearchCleared', this._onSearchCleared);
                }
                if (this.get('collection')) {
                    this.get('collection')
                        .on('change', this._onModelChange)
                        .on('powerGridSearchStarted', this.disable)
                        .on('powerGridSearchCompleted', this._onSearchCompleted)
                        .on('powerGridSearchCleared', this._onSearchCleared);
                    if(this.get('collectionLimit')){
                        this.get('collection').query.limit(this.get('collectionLimit'));
                    }
                }
                if (this.previous('collection') && !this.get('collection')) {
                    this.set('models', []);
                }
            }
            if (updated.fixedLayout && !this._settingInitialWidth) {
                this._settingInitialWidth = true;
                naturalWidths = _.map(columnModel.columns, function(c) {
                    return c.get('width');
                });
                _.each(naturalWidths, function(w, i) {
                    columnModel.columns[i].set('width', w);
                });
                this.$el.addClass('fixed-width');
                this._settingInitialWidth = false;
            }
            if (updated.columnModel) {
                this.$el[c('sortable')? 'addClass':'removeClass']('sortable');
                this.$el[c('resizable')? 'addClass':'removeClass']('resizable');
            }
            if (updated.gridIsFiltered) {
                isFiltered = this.get('gridIsFiltered');
                this.$el[isFiltered? 'addClass' : 'removeClass']('filtered');
            }

            if (sort) {
                this._sort({silent: true});
            }
            if (rerender) {
                this.rerender();
                // this._setRowTableHeight();
            }
            this.trigger('propchange', updated);
        }
    });

    asCollectionViewable.call(PowerGrid.prototype);

    return PowerGrid;
});
