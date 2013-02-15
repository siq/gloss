/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/uuid',
    'vendor/moment',
    'mesh/tests/nestedpolymorphicexample',
    './../../widgets/simpleview',
    './../widgetize',
    './../bindinggroup',
    'tmpl!./testForm.mtpl'
], function($, _, uuid, moment, NestedPolymorphicExample, SimpleView,
    widgetize, BindingGroup, testForm) {
    var strings = {
            errors: {
                invalid: 'There was an error',
                duplicate: 'duplicate object'
            },
            myform: {
                errors: {
                    duplicate: 'duplicate object'
                },
                'field-errors': {
                    name: {
                        duplicate: 'something with that name already exists'
                    }
                }
            }
        },
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

    asyncTest('every binding has a prop', function() {
        var model, myForm = MyForm({model: NestedPolymorphicExample()});
        _.each(myForm.bindingGroup.bindings, function(binding) {
            var name =  binding.get('prop')?    binding.get('prop') :
                        binding.has('widget')?  binding.get('widget').node.outerHTML :
                        binding.has('$el')?     binding.get('$el')[0].outerHTML : '';
            ok(binding.get('prop') != null, 'binding has prop for ' + name);
        });
        start();
    });

    function modelAndUiEqual(bindingGroup, values, exclusions) {
        var checked = [];
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
        deepEqual(checked.concat(exclusions || []), _.keys(values),
                'checked UI for all values');
    }

    asyncTest('binding', function() {
        var initialValues,
            myForm = MyForm().appendTo('body'),
            m = NestedPolymorphicExample();

        m.set(initialValues = {
            id: uuid(),
            name: 'foo',
            required_field: 'bar',
            enumeration_field: 2,
            default_field: 13,
            boolean_field: true,
            'composition.type': 'attribute-filter',
            'composition.expression': 'slower than molasses in january',
            date_field: moment('2013-02-14')._d
        }, {validate: true}).then(function() {
            myForm.set({model: m});
            modelAndUiEqual(myForm.bindingGroup, initialValues);
            start();
        }, function(c, e) {
            ok(false, 'initial set should have worked' +
                JSON.stringify(e.serialize(), null, '  '));
            start();
        });
    });

    start();
});
