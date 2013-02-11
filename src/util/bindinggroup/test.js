/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/tests/nestedpolymorphicexample',
    './../../widgets/simpleview',
    './../widgetize',
    './../bindinggroup',
    'tmpl!./testForm.mtpl'
], function($, _, NestedPolymorphicExample, SimpleView, widgetize, BindingGroup, testForm) {
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
                self.$el.on('change', '[data-for="composition.type"]', function() {
                    var w = _.find(self.widgets, function(w) {
                        return w.$node.is('[data-for="composition.type"]');
                    });
                    if (!w) {
                        return;
                    }
                    if (w.getValue() === 'attribute-filter') {
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
    asyncTest('binding', function() {
        var model,
            myForm = MyForm({model: NestedPolymorphicExample()}).appendTo('body');

        ok(myForm);
        window.m = model = myForm.get('model');
        window.f = myForm;
        window.b = myForm.bindingGroup;

        model.set({name: 'foo'});
        start();
    });

    start();
});
