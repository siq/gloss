define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/model',
    '../../views/view',
    './powergrid/columnmodel',
    './spinner',
    './../../mixins/ascollectionviewable',
    './../../mixins/asinfinitescrollable',
    './../../util/sort',
    'tmpl!./powergrid/powergrid.mtpl',
    'tmpl!./powergrid/spinnerTr.mtpl',
    'css!./powergrid/powergrid.css'
], function($, _, model, View, ColumnModel, Spinner,
    asCollectionViewable, asInfiniteScrollable, sort, template, loadingRowTmpl) {

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
            skipContinuityCheck:false,
            // tell the grid how many additional models to load
            collectionLimit: null,
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
                target: this.spinnerOverlay[0],
                opts: {
                    zIndex: 2
                }
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
                //  - handle reloading link
                this.on('click', '.loading-text a.reload', function() {
                    var scrollLoadDfd;
                    // self.scrollLoadSpinner.disable();
                    scrollLoadDfd = self.get('collection').load({
                        reload: true,
                        skipContinuityCheck:self.get('skipContinuityCheck')
                    });
                    self.set('scrollLoadDfd', scrollLoadDfd);
                });
            }
            if (this.get('keyboardNavigation')) {
                this._bindKeyboardNavigation();
            }
        },

        // align the grid header and rows
        _alignRows: function() {
            // th width is based on td width so make sure that is set first
            _.each(this.get('columnModel').columns, function(c) {
                c._setTdCellWidth(c.get('width'));
            });
            _.each(this.get('columnModel').columns, function(c) {
                c._setThCellWidth();
            });
            return this;
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
            var id = $(tr).attr('data-model-id'),
                model = _.find(this.get('models'), function(m) {
                    var _id = m.get('id') || m.get('cid');
                    // model id will be an int or string so we cast for proper comparison
                    return id === String(_id);
                });
            return model || null;
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
            if (!clickedModel || clickedModel.get(this.get('selectedAttr'))) {
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

        _rerender: function(models) {
            var self = this,
                i, l, rows = [],
                columns = this.get('columnModel'),
                models = models || this.get('models'),
                selected = this.selected(),
                start;

            if (!columns || !models) {
                return;
            }
            start = (new Date()).valueOf();
            for (i = 0, l = models.length; i < l; i++) {
                rows.push(columns.renderTr(models[i]));
            }

            if (this.get('infiniteScroll') && rows.length) {
                if (this._windowSize && this._isAllDataLoaded() && this._isLastWindowLoaded()) {
                    rows.push(loadingRowTmpl({
                        grid: this,
                        status: this.get('collection').status,
                        text: 'All objects loaded'
                    }));
                } else {
                    rows.push(loadingRowTmpl({
                        grid: this,
                        status: this.get('collection').status,
                        text: this._isAllDataLoaded() ? 'All objects loaded' : 'Loading ...'
                    }));
                }
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
                        zIndex: 2, // The z-index (defaults to 2000000000)
                        top: 'auto', // Top position relative to parent in px
                        left: 'auto'
                    }
                }).appendTo($target);
            }

            if (selected && !this.get('infiniteScroll')) {
                this._scrollTo(selected);
            }
            this._alignRows();
            this._renderCount++;
            setTimeout(function() {self.del('scrollFunction');}, 0);
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
                trHeight,
                scrollTop,
                scrollTo;

            // no height to calculate scrollTo
            if (!this.$rowInnerWrapper) {
                return;
            }
            trHeight = this.$rowInnerWrapper.find('tr').first().height();
            scrollTop = this.$rowInnerWrapper.scrollTop();

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
                    $rowInnerWrapper.scrollTop((tableHeight - $rowInnerWrapper.height())/2);
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
            var id;
            if (!model || _.isEmpty(model)) {
                return null;
            }
            id = model.get('id') || model.get('cid');
            return this.$tbody.children('tr[data-model-id="'+id+'"]') || null;
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

            if (this._isDisabled()) {
                return;
            }

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
            this._alignRows();
            return this;
        },

        update: function(updated) {
            var self = this,
                colName, rerender, sort, naturalWidths, collection, isFiltered,
                DummyModel, columnModel = this.get('columnModel'),
                c = function(prop) {
                    return _.find(columnModel.columns, function(column) {
                        return column.get(prop);
                    });
                };

            rerender = sort = false;

            if (updated.models) {
                rerender = sort = true;
            }
            if (updated.data) {
                if (!(DummyModel = this.get('DummyModel'))) {
                    this.set('DummyModel', DummyModel = model.Model.extend({}),
                            {silent: true});
                }
                this.set('models', _.map(this.get('data'), function(d) {
                    return DummyModel.models.instantiate(d);
                }));

                /*windowing should work even if we just set 'data' instead of a collection*/
                if(this._windowSize){
                    this.windowsCount = this._getWindowsCount(data);
                }
            }
            if (updated.collection) {
                if (this.previous('collection')) {
                    this.previous('collection')
                        .off('change', this._onModelChange)
                        .off('powerGridSearchStarted', this.disable)
                        .off('powerGridSearchCompleted', this._onSearchCompleted)
                        .off('powerGridSearchCleared', this._onSearchCleared);
                    if (this.get('infiniteScroll')) {
                        this.previous('collection').off('load');
                    }
                }
                if (this.get('collection')) {
                    this.get('collection')
                        .on('change', this._onModelChange)
                        .on('powerGridSearchStarted', this.disable)
                        .on('powerGridSearchStarting', function() {
                            var selectedAttr = self.get('selectedAttr'),
                                models = self.get('collection').mwhere(selectedAttr, true);
                            _.each(models, function(m) {
                                m.set(selectedAttr, false, {silent: true});
                            });
                        })
                        .on('powerGridSearchCompleted', this._onSearchCompleted)
                        .on('powerGridSearchCleared', this._onSearchCleared);
                    if(this.get('collectionLimit')){
                        this.get('collection').query.limit(this.get('collectionLimit'));
                    }
                    if (this.get('infiniteScroll')) {
                        this.get('collection').on('load', function() {
                            if (!self.scrollLoadSpinner) {
                                return;
                            }
                            self.scrollLoadSpinner.disable();
                        });
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
    asInfiniteScrollable.call(PowerGrid.prototype, {
        delegate: '.row-inner-wrapper',
        render: '_rerender',
        limit: 50,
    });

    return PowerGrid;
});
