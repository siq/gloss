define([
    'vendor/jquery',
    'vendor/underscore',
    'bedrock/class',
    'bedrock/mixins/aslistenable',
    'bedrock/mixins/assettable',
    'mesh/fields',
    'mesh/model',
    './../mixins/aswidgetizable',
    './../widgets/simpleview',
    './../widgets/messagelist',
    './../util/bindinggroup',
    './../util/errorUtils',
    'tmpl!./form/form.mtpl',
    'tmpl!./form/footer.mtpl',
    'css!./form/form.css'
], function($, _, Class, asListenable, asSettable, fields, Model,
    asWidgetizable, SimpleView, MessageList, BindingGroup, errorUtils,
    template, footerTemplate) {
    'use strict';

    // resourepoller maybe attached to Window. If it is turn it off on `show`
    // to prevent overwritting changes while editing a model
    /*
        Heres's why: from test_model_consistency.js
        TODO: test making a change to a model w/o saving it, then calling
        collection.refresh() -- unlike a model.refresn() it calls .set() w/o setting
        the 'noclobber' flag, so it overrides the un-persisted changes
    */
    var stopPolling = function() {
            if (window.resourcepoller) {
                window.resourcepoller.disable();
            }
        },
        startPolling = function() {
            if (window.resourcepoller) {
                window.resourcepoller.enable();
            }
        };

    var SnapShot = Class.extend();
    asSettable.call(SnapShot.prototype, {prop: null});

    var Form = SimpleView.extend({
        template: template,
        defaults: {
            globalErrorStrings: {error: 'generic error'},
            strings: {footer: {submit: 'submit', cancel: 'cancel'}},
            templates: {footer: footerTemplate, fieldsets: ''}
        },
        _bindEvents: function() {
            var self = this;
            self.listenTo('model', 'change', '_validateFields');
            _.bindAll(self, 'submit', 'processErrors', '_createSnapshot',
                '_restoreFromSnapShot', '_resetSnapshot', '_onEscape');
            self.on('cancel', self._resetSnapshot)
                .on('click', '[name=cancel_btn]', function(evt) {
                    evt.preventDefault();
                    self.trigger('cancel');
                })
                .on('submit', self.submit)
                .on('change', self._validateFields)
                .on('mouseup keyup', 'input,textarea,button',
                        self._validateFields)
                .on('keyup', function(evt) {
                    if (evt.keyCode === 27) {
                        self._onEscape(evt);
                    }
                });
            self._initBindingGroups();
            
            self.on('submit cancel', startPolling)
                .on('keyup', function(evt) {
                    if (evt.keyCode === 27) {
                        startPolling();
                    }
                });
        },
        _createSnapshot: function(model) {
            model = model instanceof Model.Model? model : this.get('model');
            this._snapshot = _.reduce(this.bindingGroups,
                function(snapshot, group) {
                    _.each(group.bindings, function(binding) {
                        var prop = binding.get('prop');
                        snapshot.set(prop, model.get(prop));
                    });
                    return snapshot;
                }, SnapShot());
        },
        _focusOnFirstVisibleBinding: function() {
            var i, l, $el, widgets = _.mpluck(this._visibleBindings(), 'widget');
            for (i = 0, l = widgets.length; i < l; i++) {
                $el = widgets[i].$node || widgets[i].$el;
                if ($el.is(':visible') && !$el.is(':disabled')) {
                    $el.focus();
                    break;
                }
            }
        },
        _initBindingGroups: function() {
            var self = this, groups = _.map(self.$el.find('[data-bind-group]'),
                function(el) {
                    return el.getAttribute('data-bind-group') || 'main';
                });
            self.bindingGroups = _.reduce(_.unique(['main'].concat(groups)),
                function(groups, name) {
                    groups[name] = BindingGroup({
                        name: name,
                        $el: self.$el,
                        widgets: self.get('widgets'),
                        strings: self.get('strings'),
                        globalErrorStrings: self.get('globalErrorStrings')});
                    return groups; //this.get('strings.errors'); if not present fall back
                }, {});
        },
        _initWidgets: function() {
            var $messageList = this.$el.children('.messagelist');
            if ($messageList.length) {
                this.set('messageList', MessageList($messageList));
            }
            return this._super.apply(this, arguments);
        },
        _onEscape: function(evt) {
            this._resetSnapshot();
        },
        // this is intended to be overridden by child classes.
        //
        // parameters:
        //  globalErrors: either null or an an array of {token: ...} objects
        //  fieldErrors: either null or an instance of fields.CompoundError
        //  xhr: either null or the jqXHR obj that was returned from an xhr call
        _processErrors: function(globalErrors, fieldErrors, xhr) {
            var stringErrors;
            // we only want to show the relevant errors but we don't want to hide errors either
            // this means only showing the field specific errors when they're present
            // but sometimes the api doesn't tells us what the global or field errors are :(
            // shame on you api! 
            // in this case we still want to process the xhr for error info
            if (globalErrors || (!globalErrors && !fieldErrors)) {
                if (this.get('globalErrorStrings')) {
                    stringErrors = 
                        [$.extend({}, this.get('globalErrorStrings'), this.get('strings.errors'))];
                }
                errorUtils.processGlobalErrors([globalErrors], xhr,
                    this.get('messageList'), null, stringErrors);
            }
            _.each(this.bindingGroups, function(group) {
                group.processErrors(fieldErrors);
            });
        },
        _resetSnapshot: function() {
            this._restoreFromSnapShot.apply(this, arguments);
            this._createSnapshot.apply(this, arguments);
        },
        _restoreFromSnapShot: function(model) {
            var prop, snapshot = this._snapshot;
            model = model instanceof Model.Model? model : this.get('model');
            if (!this._snapshot) {
                return;
            }
            delete this._snapshot;
            _.each(this.bindingGroups, function(group) {
                _.each(group.bindings, function(binding) {
                    prop = binding.get('prop');
                    model.set(prop, snapshot.get(prop));
                });
            });
        },
        // return a list of bindings that correspond to UI elements in the
        // visible pane
        _visibleBindings: function(name) {
            name = name || 'main';
            return _.filter(this.bindingGroups[name].bindings,
                function(binding) {
                    var $el = binding.has('widget')?
                        binding.get('widget.$node') || binding.get('widget.$el') :
                        binding.get('$el');
                    return $el.is(':visible');
                });
        },
        // we want to know if the current model would validate *if we were to
        // set it with the values of the visible fields*, so we can't just
        // check the current model, we need to create a dummy model with the
        // desired values and validate that
        _validateFields: function() {
            var dummyModels, self = this;
            dummyModels = _.map(self.bindingGroups, function(group, name) {
                var props, dummy, model = self.get('models.' + name);
                if (!model) {
                    return $.Deferred().resolve().then(function() {
                        self.set('visibleFieldsAreValid', false);
                    });
                }
                props = _.reduce(self._visibleBindings(name),
                    function(model, binding) {
                        var prop = binding.get('prop'),
                            widget = binding.get('widget');
                        if (widget) {
                            model[prop] = widget.getValue();
                        }
                        return model;
                    }, {});
                dummy = model.__models__.instantiate(props);
                return dummy.validate(_.keys(props));
            });
            return $.when.apply($, dummyModels).then(function() {
                self.set('visibleFieldsAreValid', true);
            }, function() {
                self.set('visibleFieldsAreValid', false);
            });
        },
        _validateModel: function() {
            var dfd = $.Deferred();
            this.get('model').validate().then(function() {
                dfd.resolve();
            }, function(errors) {
                dfd.reject([null, errors]);
            });
            return dfd;
        },
        // Overriding this to address the case when you're form is in a modal and the escape button
        // is pressed but the modal has focus and not the form. In this case we still want to
        // startPolling. This typically only happens when a form has not actual input elements.
        hide: function() {
            this._super.apply(this, arguments);
            startPolling();
            return this;
        },
        // this is used as the callback to either a failed xhr request or just
        // a failed client-side validation. you probably want to override
        // _processErrors instead of this method
        processErrors: function(response, xhr) {
            var globalErrors, fieldErrors;
            if (response && response[0]) {
                globalErrors = response[0];
            }
            if (response && response[1]) {
                fieldErrors = response[1] instanceof fields.ValidationError?
                    response[1] :
                    fields.ValidationError.fromPlainObject(response[1]);
            }
            return this._processErrors(globalErrors, fieldErrors, xhr);
        },
        resetFields: function(options) {
            _.each(this.bindingGroups, function(group) {
                _.each(group.bindings, function(binding) {
                    var widget = binding.get('widget');
                    if (widget) {
                        widget.clearStatus(options);
                    }
                });
            });
            if (this.get('messageList')) {
                this.get('messageList').clear(options);
            }
            this._validateFields();
            return this;
        },
        show: function() {
            var bindings, ret = this._super.apply(this, arguments);
            this.resetFields({animate: false});
            this._focusOnFirstVisibleBinding();
            stopPolling();
            return ret;
        },
        submit: function(evt) {
            var self = this;
            if (evt) {
                evt.preventDefault();
            }
            this.resetFields();
            return self._validateModel().then(function() {
                return self.get('model').save();
            }).fail(self.processErrors);
        },
        update: function(changed) {
            var method, submit, self = this;
            self._super.apply(self, arguments);
            if (changed.model) {
                if (this.previous('model') && this._snapshot) {
                    this._restoreFromSnapShot(this.previous('model'));
                }
                this._createSnapshot();
                this.set('models.main', this.get('model'));
            }
            if (changed.models) {
                self.waitForInitialRender.then(function() {
                    _.each(self.bindingGroups, function(group, name) {
                        group.set('model', self.get('models.' + name));
                    });
                    self._validateFields();
                });
            }
            if (changed.visibleFieldsAreValid) {
                method = self.get('visibleFieldsAreValid')?
                    'enable' : 'disable';
                if ((submit = self.getWidget('submit'))) {
                    submit[method]();
                }
            }
        }

    });

    asWidgetizable.call(Form.prototype);
    asListenable.call(Form.prototype);

    return Form;
});
