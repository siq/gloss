/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/tests/nestedpolymorphicexample',
    './../form',
    'tmpl!./test.mtpl',
    'tmpl!./testTwoModel.mtpl',
    './tstutil'
], function($, _, Resource, Form, testTemplate, testTwoModelTemplate, util) {
    var assertFieldHasError = util.assertFieldHasError,
        assertFieldHasNoError = util.assertFieldHasNoError,
        assertNoErrors = util.assertNoErrors,
        typeTextInField = util.typeTextInField;

    var MyForm = Form.extend({
        defaults: {
            templates: {fieldsets: testTemplate}
        }
    });

    var TwoModelForm = Form.extend({
        defaults: {
            templates: {fieldsets: testTwoModelTemplate},
            strings: {footer: {submit: 'foo', cancel: 'bar'}}} // Test overwrite
    });

    asyncTest('initialization', function() {
        var appendTo = '#qunit-fixture', f = MyForm().appendTo(appendTo), m = Resource();
        f.set('model', m);
        assertFieldHasError(f, 'name', 'blanktexterror');
        f.show();
        assertNoErrors(f);
        start();
    });

    asyncTest('enable submit button on valid input', function() {
        var appendTo = '#qunit-fixture', f = MyForm().appendTo(appendTo), m = Resource();
        f.set('model', m);
        f.show();
        equal(f.getWidget('submit').getState('disabled'), true);
        typeTextInField(f, 'name', 'foo');
        equal(f.getWidget('submit').getState('disabled'), true);
        typeTextInField(f, 'required_field', 'bar');
        equal(f.getWidget('submit').getState('disabled'), false);
        start();
    });

    asyncTest('two models', function() {
        var appendTo = 'body', f = TwoModelForm().appendTo(appendTo),
            m1 = Resource(),
            m2 = Resource();
        assertNoErrors(f);
        f.set('models', {main: m1}); // could also be `f.set('model', m1)`
        assertFieldHasError(f, 'name', 'blanktexterror');
        assertFieldHasNoError(f, 'association_name');
        f.set('models.association', m2);
        assertFieldHasError(f, 'name', 'blanktexterror');
        assertFieldHasError(f, 'association_name', 'blanktexterror');
        f.show();
        assertNoErrors(f);
        start();
    });

    start();
});
