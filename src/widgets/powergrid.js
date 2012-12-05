// TODO:
//  - edit row
//  - pager
//  - static header
//  - keyboard navigation
//  - lining up numbers based on decimal point
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/model',
    './../view',
    './ascollectionviewable',
    './powergrid/columnmodel',
    './spinner',
    './../util/sort',
    'tmpl!./powergrid/powergrid.mtpl',
    'css!./powergrid/powergrid.css'
], function($, _, model, View, asCollectionViewable, ColumnModel, Spinner,
    sort, template) {

    var EmptyColumnModel, PowerGrid,
        mod = /mac/i.test(navigator.userAgent)? 'metaKey' : 'ctrlKey';

    EmptyColumnModel = ColumnModel.extend({});

    PowerGrid = View.extend({
        defaults: {
            // could be true, false, or 'multi'
            selectable: false,

            // things seem less buggy when we do mouseup as opposed to click
            selectableEvent: 'mouseup',

            // this is the attribute set on the model corresponding to which
            // grid row is selected. so if you want to know which model is
            // selected in a grid, you can do something like:
            //
            //     grid.get('collection').where(grid.get('selectedAttr'), true);
            //
            // if this is left as 'null', then selectedAttr will be set to
            // something unique to the grid instance at instantiation time.
            //
            // this, of course, doesn't matter if 'selectable' is false
            selectedAttr: null
        },

        template: template,

        init: function() {
            var selectable;

            this._super.apply(this, arguments);

            this.$tbody = this.$el.find('table.rows tbody');

            _.bindAll(this, '_onColumnChange', '_onModelChange',
                    '_onMultiselectableRowClick', '_onSelectableRowClick');

            this.on('columnchange', this._onColumnChange);

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
                $rows = this.$el.find('.row-wrapper');
            $rows.on('scroll', function(evt) {
                var left = parseInt($header.css('left'), 10) || 0;
                if (left !== $rows.scrollLeft()) {
                    $header.css({
                        left: -$rows.scrollLeft() + 'px'
                    });
                }
            });
        },

        _setRowTableHeight: function() {
            var $header = this.$el.find('.header-wrapper'),
                $rows = this.$el.find('.row-wrapper');
            if ($rows.height() !== (this.$el.height() - $header.height())) {
                $rows.height(this.$el.height() - $header.height());
            }
        },

        _isFiltered: function() {
            var collection = this.get('collection');
            return collection && collection.query.params.query != null;
        },

        _modelFromTr: function(tr) {
            var idx = this.$tbody.children('tr').index(tr);
            return idx >= 0? this.get('models')[idx] : null;
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

        _onModelChange: function(eventName, coll, model, changed) {
            // console.log(this.el.id+' changing '+model.get("text_field"));
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

        _rerender: function() {
            var i, l, rows = [],
                columns = this.get('columnModel'),
                models = this.get('models');

            var start = (new Date()).valueOf();

            if (!columns || !models) {
                return;
            }

            for (i = 0, l = models.length; i < l; i++) {
                rows.push(columns.renderTr(models[i]));
            }

            this.$tbody.html(rows.join(''));

            this._renderCount++;
            // console.log([
            //         'render time for',
            //         this.get('models').length+':',
            //         (new Date()).valueOf() - start
            //     ].join(' '));
        },

        _rerenderRow: function(model) {
            var currentRow = this._trFromModel(model);
            $(this.get('columnModel').renderTr(model)).insertAfter(currentRow);
            $(currentRow).remove();
            this._renderRowCount++;
            // console.log('rerendered row for', model.get('text_field'));
        },

        _sort: function(opts) {
            var ascending, self = this,
                column = _.find(self.get('columnModel').columns, function(c) {
                    return c.get('sort');
                });
            if (!column || !column.get('sortable') || !self.get('models')) {
                return;
            }
            ascending = /asc/i.test(column.get('sort'));
            self.set('models',
                // copy the models array then sort it
                self.get('models').slice(0).sort(function(a, b) {
                    return (ascending? 1 : -1) * sort.userFriendly(
                        column.getSortValue(a), column.getSortValue(b));
                }), opts);
        },

        _trFromModel: function(model) {
            var idx = _.indexOf(this.get('models'), model);
            return idx >= 0? this.$tbody.children('tr').eq(idx) : null;
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
                selected = function(m) { return m.get(a); };

            opts = opts || {};

            // first just get a list of all the changes that need to happen
            if (!opts.dontUnselectOthers) {
                _.each(models, function(m) {
                    if (m !== model && m.get(a)) {
                        changes.push({model: m, action: 'del'});
                    }
                });
            }

            if (opts.selectTo && _.any(models, selected)) {
                indices = [
                    _.indexOf(_.map(models, selected), true),
                    _.lastIndexOf(_.map(models, selected), true),
                    _.indexOf(models, model)
                ];
                _.each(_.range(_.min(indices), _.max(indices)), function(i) {
                    if (models[i] !== model && !models[i].get(a)) {
                        changes.push({model: models[i], action: 'set'});
                    }
                });
            }

            if (!model.get(a)) {
                changes.push({model: model, action: 'set'});
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
                isFiltered = this._isFiltered();
                this.$el[isFiltered? 'addClass' : 'removeClass']('filtered');
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
                        .off('change', this._onModelChange);
                }
                if (this.get('collection')) {
                    this.get('collection')
                        .on('change', this._onModelChange);
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

            if (sort) {
                this._sort({silent: true});
            }
            if (rerender) {
                this.rerender();
                this._setRowTableHeight();
            }
            this.trigger('propchange', updated);
        }
    });

    asCollectionViewable.call(PowerGrid.prototype);

    return PowerGrid;
});
