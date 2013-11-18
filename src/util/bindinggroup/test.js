/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/uuid',
    'vendor/moment',
    'mesh/tests/nestedpolymorphicexample',
    'mesh/fields',
    './../../widgets/simpleview',
    './../widgetize',
    './../bindinggroup',
    'tmpl!./testForm.mtpl',
    'css!./test.css'
], function($, _, uuid, moment, NestedPolymorphicExample, fields, SimpleView,
    widgetize, BindingGroup, testForm) {
    var strings = {
            errors: {
                invalid: 'There was an error',
                duplicate: 'duplicate object'
            },
            myform: {
                errors: {
                    duplicate: 'duplicate form object'
                },
                field_errors: {
                    name: {
                        duplicate: 'something with that name already exists'
                    }
                }
            }
        },
        FinnickyModel = NestedPolymorphicExample.extend({
            _validateOne: function(prop, value) {
                if (prop === 'name' && value === 'duplicate name') {
                    throw fields.ValidationError(null, {token: 'duplicate'});
                }
                if (prop === 'required_field' &&
                    value === 'duplicate required_field') {
                    throw fields.ValidationError(null, {token: 'duplicate'});
                }
            }
        }),
        MyForm = SimpleView.extend({
            template: testForm,
            _bindTypeChangeEvent: function() {
                var self = this;
                self.$el.on('change', '[data-bind="composition.type"]', function() {
                    var widget = _.find(self.widgets, function(w) {
                        return w.$node.is('[data-bind="composition.type"]');
                    });
                    if (!widget) {
                        return;
                    }
                    if (widget.getValue() === 'attribute-filter') {
                        self.$el.find('.attribute-filter').removeClass('hidden');
                        self.$el.find('.datasource-list').addClass('hidden');
                    } else {
                        self.$el.find('.attribute-filter').addClass('hidden');
                        self.$el.find('.datasource-list').removeClass('hidden');
                    }
                });
            },
            render: function() {
                this._super.apply(this, arguments);
                this.widgets = widgetize(this.$el);
                this.bindingGroup = BindingGroup({
                    $el: this.$el,
                    widgets: this.widgets,
                    strings: strings.myform
                });
                this._bindTypeChangeEvent();
            },
            update: function(changed) {
                var self = this;
                self._super.apply(self, arguments);
                if (changed.model) {
                    self.waitForInitialRender.then(function() {
                        self.bindingGroup.set('model', self.get('model'));
                    });
                }
            }
        });

    function initialValues() {
        return {
            id: uuid(),
            name: 'foo',
            required_field: 'bar',
            enumeration_field: 2,
            default_field: 13,
            boolean_field: true,
            'composition.type': 'attribute-filter',
            'composition.expression': 'slower than molasses in january',
            date_field: moment('2013-02-14')._d
        };
    }

    function modelAndUiEqual(bindingGroup, values, exclusions) {
        var checked = [], unchecked;
        _.each(values, function(val, key) {
            var w, $el,
                binding = _.find(bindingGroup.bindings, function(binding) {
                    return binding.get('prop') === key;
                }),
                prop = binding && binding.get('prop');
            equal(bindingGroup.get('model').get(key), val, 'model ' + key);
            if (binding && (w = binding.get('widget'))) {
                equal(w.getValue(), val, 'widget ' + prop);
                checked.push(prop);
            } else if (binding && ($el = binding.get('$el'))) {
                equal($el.text(), val, '$el ' + prop);
                checked.push(prop);
            }
        });
        unchecked = _.difference(checked.concat(exclusions || []), _.keys(values));
        equal(checked.concat(exclusions || []).length, _.keys(values).length);
        deepEqual(unchecked, [], 'checked UI for all values');
    }

    asyncTest('every binding has a prop', function() {
        var model, myForm = MyForm({model: FinnickyModel()});
        _.each(myForm.bindingGroup.bindings, function(binding) {
            var name =  binding.get('prop')?    binding.get('prop') :
                        binding.has('widget')?  binding.get('widget').node.outerHTML :
                        binding.has('$el')?     binding.get('$el')[0].outerHTML : '';
            ok(binding.get('prop') != null, 'binding has prop for ' + name);
        });
        start();
    });

    asyncTest('error handling', function() {
        var myForm = MyForm({model: FinnickyModel(initialValues())})
                .appendTo('body'),
            name = _.find(myForm.widgets, function(w) {
                return w.$node.attr('data-bind') === 'name';
            }),
            requiredField = _.find(myForm.widgets, function(w) {
                return w.$node.attr('data-bind') === 'required_field';
            });

        equal(name.options.messageList.$node.text(), '');
        ok(!name.$node.hasClass('invalid'));
        name.setValue('duplicate name');
        equal(name.options.messageList.$node.text(),
            strings.myform.field_errors.name.duplicate);
        ok(name.$node.hasClass('invalid'));
        name.setValue();
        ok(/blank/.test(name.options.messageList.$node.text()));
        ok(name.$node.hasClass('invalid'));
        name.setValue('donezo');
        // wait for animation timeout
        setTimeout(function() {
            equal(name.options.messageList.$node.is(':visible'), false);
            ok(!name.$node.hasClass('invalid'));
            start();
        }, 500);
    });

    asyncTest('binding', function() {
        var values = initialValues(),
            myForm = MyForm().appendTo('body'),
            m = FinnickyModel();
        // If the model has a cid, the model will be populated with values from it's bound widgets, the test do not expect this
        m.cid = null;
        m.set(values, {validate: true}).then(function() {
            var newValues = _.extend({}, values, {
                name: 'foo 2',
                'composition.type': 'datasource-list',
                'composition.expression': [uuid(), uuid()]
            });
            myForm.set({model: m});
            modelAndUiEqual(myForm.bindingGroup, values);
            m.set(newValues);
            modelAndUiEqual(myForm.bindingGroup, newValues);
            window.m = myForm.get('model');
            window.f = myForm;
            window.b = myForm.bindingGroup;
            start();
        }, function(e, c) {
            ok(false, 'initial set should have worked' +
                JSON.stringify(e.serialize(), null, '  '));
            start();
        });
    });

    start();
});
