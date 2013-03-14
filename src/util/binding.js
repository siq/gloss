define([
    'vendor/underscore',
    'bedrock/class',
    'bedrock/mixins/assettable'
], function(_, Class, asSettable) {
    var Binding = Class.extend({
        init: function(options) {
            _.bindAll(this, '_onPropChange', '_onUIChange');
            this.set(options);
        },
        _getValueFromModel: function() {
            return this.get('model').get(this.get('prop'));
        },
        _handleSetFailure: function(prop, error) {
            var msg, widget = this.get('widget'), token = error && error.token;
            msg = _.compact(_.pluck(this.get('strings'), token))[0] ||
                  error.message || token;
            widget.setStatus('invalid', msg);
        },
        _onPropChange: function(eventName, model, changed) {
            if (!changed[this.get('prop')]) {
                return;
            }
            this._setValueFromModel();
        },
        _onUIChange: function() {
            var model, value, widget, self = this, prop = self.get('prop');
            if ((widget = self.get('widget')) && (model = self.get('model'))) {
                value = widget.getValue();
                widget.clearStatus();
                model.set(prop, value, {validate: true})
                    .fail(function(errors, changes) {
                        var error = errors.forField(prop);
                        if (error) {
                            self._handleSetFailure(prop, error);
                        }
                    });
            }
        },
        _setValueFromModel: function() {
            var widget, setValue, $el;
            if ((widget = this.get('widget'))) {
                widget.setValue(this._getValueFromModel());
            } else if ((setValue = this.get('setValue'))) {
                setValue(this._getValueFromModel());
            } else if (($el = this.get('$el'))) {
                $el.text(this._getValueFromModel());
            }
        },
        update: function(changed) {
            var bindPropChange, bindUIChange;
            if (changed.model) {
                if (this.previous('model')) {
                    this.previous('model').off('change', this._onPropChange);
                }
                bindPropChange = true;
            }
            if (changed.widget) {
                if (this.previous('widget')) {
                    this.previous('widget').off('change', this._onUIChange);
                }
                bindUIChange = bindUIChange || this.get('twoWay');
            }
            if (changed.twoWay) {
                bindUIChange = bindUIChange || this.get('twoWay');
            }

            if (bindPropChange) {
                this._setValueFromModel();
                this.get('model').on('change', this._onPropChange);
            }
            if (bindUIChange) {
                if (this.has('widget')) {
                    this.get('widget').on('change', this._onUIChange);
                }
            }
        }
    });

    asSettable.call(Binding.prototype, {onChange: 'update'});

    return Binding;
});
