define([
    'vendor/underscore',
    'bedrock/class',
    'bedrock/mixins/assettable',
    'mesh/fields'
], function(_, Class, asSettable, fields) {
    var Binding = Class.extend({
        init: function(options) {
            _.bindAll(this, '_onPropChange', '_onUIChange', 'processErrors');
            this.set(options);
        },
        _getValueFromModel: function() {
            return this.get('model').get(this.get('prop'));
        },
        _handleSingleError: function(error) {
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
            var model, value, widget, prop = this.get('prop');
            if ((widget = this.get('widget')) && (model = this.get('model'))) {
                value = widget.getValue();
                widget.clearStatus();
                model.set(prop, value, {validate: true})
                    .fail(this.processErrors);
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
        processErrors: function(errors) {
            var error = errors instanceof fields.CompoundError?
                    errors.forField(this.get('prop')) : errors;
            if (error) {
                this._handleSingleError(error);
            }
            return this;
        },
        update: function(changed) {
            var bindPropChange, bindUIChange;
            if (changed.model) {
                if (this.previous('model')) {
                    this.previous('model').off('change', this._onPropChange);
                }
                bindPropChange = bindPropChange || !!this.get('model');
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
