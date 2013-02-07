define([
    'vendor/underscore',
    'bedrock/class',
    'bedrock/assettable'
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
            var msg, messageList = this.get('widget.options.messageList'),
                token = error && error.token;
            if (messageList) {
                msg = _.compact(_.pluck(this.get('strings'), token))[0] ||
                      error.message || token;
                messageList.append(msg);
            }
        },
        _onPropChange: function(eventName, model, changed) {
            if (!changed[this.get('prop')]) {
                return;
            }
            this._setValueFromModel();
        },
        _onUIChange: function() {
            var model, prop = this.get('prop'),
                value = this.has('widget') && this.get('widget').getValue();
            if (value && (model = this.get('model'))) {
                model.set(prop, value, {validate: true})
                    .fail(function(changes, errors) {
                        var error = errors.forField(prop);
                        if (error) {
                            this._handleSetFailure(prop, error);
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
        clearErrors: function() {
            var messageList = this.get('widget.options.messageList');
            if (messageList) {
                messageList.clear();
            }
        },
        showError: function(errorMessage) {
            var messageList = this.get('widget.options.messageList');
            if (messageList) {
                messageList.push('invalid', errorMessage);
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
                this.get('model').on('change', this._onPropChange);
            }
            if (bindUIChange) {
                if (this.has('widget')) {
                    this.get('widget')
                        .off('change', this._onUIChange)
                        .on('change', this._onUIChange);
                }
            }
        }
    });

    asSettable.call(Binding.prototype, {
        prop: null,
        onChange: 'update'
    });

    return Binding;
});
