define([
    'vendor/underscore',
    'bedrock/mixins/assettable',
    'bedrock/mixins/aslistenable',
    'gloss/widgets/button',
    'gloss/widgets/powergrid',
    'gloss/widgets/powergrid/columnmodel',
    'gloss/widgets/powergrid/column',
    'gloss/widgets/powergrid/powergridsearch',
    'gloss/widgets/powergrid/asformwidget',
    'gloss/widgets/simpleview',
    'tmpl!./listbuilder/listbuilder.mtpl',
    'css!./listbuilder/listbuilder.css'
], function(_, asSettable, asListenable, Button, PowerGrid, ColumnModel,
    Column, GridFilter, asFormWidget, SimpleView,
    template) {
    'use strict';

    function MakeGridClass(Grid) {
        var GridClass = Grid.extend({
            defaults: {
                collectionMap: function(models) {
                    var attr = this.get('selectedDocAttr');
                    return _.mwhere(models, attr, undefined);
                }
            }
        });
        return GridClass;
    }
    function MakeSelectedGridClass(Grid) {
        var SelectedGridClass = Grid.extend({
            defaults: {
                collectionMap: function(models) {
                    var attr = this.get('selectedDocAttr');
                    return _.mwhere(models, attr, true);
                }
            }
        });
        asFormWidget.call(SelectedGridClass.prototype);
        SelectedGridClass = SelectedGridClass.extend({
            _onChangeFormValue: function() {
                this.trigger('change');
            },
            getValue: function() {
                var attr = this.get('selectedDocAttr');
                return _.mpluck(_.mwhere(this.get('models'), attr, true), 'id');
            },
            setValue: function(newValue) {
            },
            update: function(changed) {
                Grid.prototype.update.apply(this, arguments);
                if(changed.models) {
                    // only trigger change if the models changed
                    // this is necessary for validation to occur
                    if (_.difference(this.get('models'), this.previous('models')).length !== 0 ||
                        _.difference(this.previous('models'), this.get('models')).length !== 0) {
                        this._onChangeFormValue();
                    }
                }
            }
        });
        asSettable.call(SelectedGridClass.prototype, {areEqual: _.isEqual});
        return  SelectedGridClass;
    }

    var ListBuilder = SimpleView.extend({
        template: template,
        defaults: {
            gridClass: null     // *required: set the default Grid class on instantiation
            // dataCollection:
            // selectedDataCollection:
        },
        _initWidgets: function() {
            var ret = this._super.apply(this, arguments),
                attr = '_'+this.el.id+'_selectedForDoc',
                SelectedGridClass, GridClass, placeholder, searchBtnTxt;

            this.set('selectedDocAttr', attr);

            SelectedGridClass = MakeSelectedGridClass(this.get('gridClass'));
            GridClass = MakeGridClass(this.get('gridClass'));
            this.selectedDataGrid = SelectedGridClass({
                selectedDocAttr: attr,
                $el: this.$el.find('.selected-data .grid')
            });
            this.dataGrid = GridClass({
                selectedDocAttr: attr,
                $el: this.$el.find('.data .grid')
            });
            searchBtnTxt = GridFilter.prototype.defaults.searchButtonText;
            placeholder = GridFilter.prototype.defaults.placeholder;
            this.dataFilter =
                GridFilter(this.$el.find('.data .filter'), {
                    searchButtonText: this.get('strings.search.button') || searchBtnTxt,
                    placeholder: this.get('strings.search.placeholder') || placeholder
                });
            this.addButton = Button(this.$el.find('button[name=add]'));
            this.removeButton = Button(this.$el.find('button[name=remove]'));
            this.addButton.disable();
            this.removeButton.disable();

            this.listenTo('selectedDataCollection', 'change', '_onDataChange');
            this.listenTo('dataCollection', 'change', '_onDataChange');
            this.listenTo('dataCollection', 'powerGridSearchStarted',
                    '_onGridSearch');

            return ret;
        },
        _bindEvents: function() {
            var self = this,
                sdGrid = this.selectedDataGrid,
                dataGrid = this.dataGrid,
                ret = this._super.apply(this, arguments);

            this.on('click', '[name=add]', function(evt) {
                self._onAction(dataGrid, 'select');
            });
            this.on('click', '[name=remove]', function(evt) {
                self._onAction(sdGrid, 'unselect');
            });

            return ret;
        },
        _onAction: function(grid, method) {
            var ids, models = grid.selected();
                grid.unselect(models);
            models = _.compact(_.isArray(models)? models : [models]);
            ids = _.mpluck(models, 'id');
            if (ids.length > 0) {
                this[method](ids);
            }
        },
        _onDataChange: function(evtName, collection) {
            var attr, widget;
            if (collection === this.dataGrid.get('collection')) {
                attr = this.dataGrid.get('selectedAttr');
                widget = this.addButton;
            } else {
                attr = this.selectedDataGrid.get('selectedAttr');
                widget = this.removeButton;
            }
            widget[collection.mfindWhere(attr, true)? 'enable' : 'disable']();
        },
        _onGridSearch: function() {
            this.get('selectedDataCollection').refresh();
        },
        _select: function(ids) {
            var data = this.dataGrid.get('models'),
                selectedData = this.selectedDataGrid.get('models'),
                attr = this.get('selectedDocAttr');

            _.each(ids, function(id, i) {
                var silent = i !== ids.length-1,
                    m1 = _.mfindWhere(selectedData, 'id', id),
                    m2 = _.mfindWhere(data, 'id', id);
                if (m1) {
                    m1.set(attr, true, {silent: silent});
                }
                if (m2) {
                    m2.set(attr, true, {silent: silent});
                }
            });
        },
        _unselect: function(ids) {
            var data = this.dataGrid.get('models'),
                selectedData = this.selectedDataGrid.get('models'),
                attr = this.get('selectedDocAttr');

            _.each(ids, function(id, i) {
                var silent = i !== ids.length-1,
                    m1 = _.mfindWhere(selectedData, 'id', id),
                    m2 = _.mfindWhere(data, 'id', id);
                if (m1) {
                    m1.del(attr, {silent: silent});
                }
                if (m2) {
                    m2.del(attr, {silent: silent});
                }
            });
        },
        clearStatus: function(){
            return this.selectedDataGrid.clearStatus
                .apply(this.selectedDataGrid, arguments);
        },
        getValue: function() {
            return this.selectedDataGrid.getValue
                .apply(this.selectedDataGrid, arguments);
        },
        select: function(ids) {
            // if !ids then select all
            ids = !ids? this.get('dataCollection').mpluck('id') :
                    _.isArray(ids)? ids : [ids];
            this._select(ids);
        },
        setStatus: function(){
            return this.selectedDataGrid.setStatus
                .apply(this.selectedDataGrid, arguments);
        },
        setValue: function(newValue) {
            this.unselect();
            if ((_.isArray(newValue) && newValue.length === 0) ||
                    newValue === void 0) {
                return;
            } else {
                this.select(newValue);
            }
        },
        show: function() {
            this.propagate('show');
        },
        unselect: function(ids) {
            // if !ids then unselect all
            ids = !ids? this.get('dataCollection').mpluck('id') :
                    _.isArray(ids)? ids : [ids];
            this._unselect(ids);
        },
        update: function(changed) {
            var self = this;
            this._super.apply(this, arguments);
            if (changed.selectedDataCollection) {
                self.waitForInitialRender.then(function() {
                    self.selectedDataGrid
                        .set('collection', self.get('selectedDataCollection'));
                });
            }
            if (changed.dataCollection) {
                self.waitForInitialRender.then(function() {
                    self.dataGrid.set('collection', self.get('dataCollection'));
                    self.dataFilter.set('collection', self.get('dataCollection'));
                });
            }
            if (changed.messageList) {
                this.selectedDataGrid.set('messageList', this.get('messageList'));
            }
            if (changed.grid) {

            }
        }
    });

    asListenable.call(ListBuilder.prototype);

    return ListBuilder;
});

