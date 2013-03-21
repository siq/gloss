define([
    'vendor/jquery',
    'vendor/underscore',
    './column/checkboxcolumn'
], function($, _, CheckBoxColumn) {
    function asFormWidget(opts) {
        var selectable = this.defaults.selectable || true,
            prop = (opts && opts.prop) || 'id';

        this.init = _.wrap(this.init, function(init) {
            _.bindAll(this, '_onChangeFormValue');
            return init.apply(this, _.rest(arguments, 1));
        });

        this._onChangeFormValue = function(evtName, xhr, model, changed) {
            var selectedProp = this._asFormWidgetSelectedProp();
            if (changed[selectedProp]) {
                this.trigger('change');
            }
        };

        this._asFormWidgetCheckBoxColumn = function() {
            return _.find(this.get('columnModel').columns, function(c) {
                return c instanceof CheckBoxColumn;
            });
        };

        this._asFormWidgetIsMultiSelect = function() {
            var cb = this._asFormWidgetCheckBoxColumn();
            return cb?
                cb.get('type') === 'checkbox' :
                this.get('selectable') === 'multi';
        };

        this._asFormWidgetSelectedProp = function() {
            var cb;
            if (this._asFormWidgetSelectedPropName) {
                return this._asFormWidgetSelectedPropName;
            }
            return (cb = this._asFormWidgetCheckBoxColumn())?
                this._asFormWidgetSelectedPropName = cb.get('prop') :
                this._asFormWidgetSelectedPropName = this.get('selectedAttr');
        };

        this._asFormWidgetSelected = function() {
            var selectedProp = this._asFormWidgetSelectedProp(),
                cb = this._asFormWidgetCheckBoxColumn(),
                multi = this._asFormWidgetIsMultiSelect(),
                where = multi? 'where' : 'findWhere';
            return cb?
                _[where](this.get('models'), selectedProp, true) :
                this.selected();
        };

        this.clearStatus = function(opts) {
            var messageList = this.get('messageList');
            if (messageList) {
                messageList.clear(opts);
            }
            return this;
        };

        this.getValue = function() {
            var multi = this._asFormWidgetIsMultiSelect(),
                m = this._asFormWidgetSelected();
            return multi? m && _.mpluck(m, prop) : m && m.get(prop);
        };

        this.setStatus = function(type, msg) {
            var messageList = this.get('messageList');
            if (!messageList) {
                return;
            }
            messageList.clear();
            if (type) {
                messageList.append(type, msg);
            }
            return this;
        };

        this._setValue = function(values) {
            var changes, cb = this._asFormWidgetCheckBoxColumn(),
                selectedProp = this._asFormWidgetSelectedProp(),
                models = _.filter(this.get('models'), function(m) {
                    return _.indexOf(values, m.get(prop)) >= 0;
                });
            if (cb) {
                changes = _.compact(_.map(this.get('models'), function(m) {
                    if (!cb._isDisabled(m)) {
                        if (values.indexOf(m.get(prop)) >= 0) {
                            if (!m.get(selectedProp)) {
                                return {model: m, value: true};
                            }
                        } else {
                            if (m.get(selectedProp)) {
                                return {model: m, value: false};
                            }
                        }
                    }
                }));
                this._disableRerender = true;
                _.each(changes, function(change, i) {
                    change.model.set(selectedProp, change.value, {
                        silent: i+1 < changes.length
                    });
                });
                this._disableRerender = false;
                if (changes.length > 0) {
                    if (changes.length > 2) {
                        this.rerender();
                    } else {
                        _.map(_.pluck(changes, 'model'), this.rerender);
                    }
                }
            } else {
                this.select(models);
            }
        };

        this.setValue = function(newValue) {
            this._setValue(_.isArray(newValue)? newValue : [newValue]);
            return this;
        };

        this.update = _.wrap(this.update, function(update, changed) {
            if (changed.collection) {
                if (this.previous('collection')) {
                    this.previous('collection')
                        .off('change', this._onChangeFormValue);
                }
                if (this.get('collection')) {
                    this.get('collection')
                        .on('change', this._onChangeFormValue);
                }
            }
            return update.apply(this, _.rest(arguments, 1));
        });
    }
    return asFormWidget;
});
