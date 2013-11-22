/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'mesh/tests/nestedpolymorphicexample',
    './../wizard',
    'tmpl!./test.mtpl'
], function($, Resource, Wizard, testTemplate) {
    var globalErrorStrings = {
        invalid: "There was an error",
        nonnull: "Cannot be blank.",
        blanktexterror: "Cannot be blank."
    };

    var TestWizard = Wizard.extend({
            defaults: {
                globalErrorStrings: globalErrorStrings,
                strings: {
                    panes: [
                        {title: 'step one', instruction: 'take a deep breath'},
                        {title: 'step two', instruction: 'dont do anything stupid'}
                    ]
                }
            }
        }),
        TestWizardWithOverriddenButton = TestWizard.extend({
            defaults: { globalErrorStrings: globalErrorStrings, strings: {footer: {cancel: 'geeeeeee'}}}
        }),
        // copy of hardcoded defaults for form and wizard footers
        allStrings = $.extend(true, {},
                              {footer: {submit: 'submit', cancel: 'cancel'}},
                              {footer: {back: 'back', next: 'next'}});

    asyncTest('overriding button strings', function() {
        var appendTo = '#qunit-fixture',
            tw = TestWizard().appendTo(appendTo),
            twwob = TestWizardWithOverriddenButton().appendTo(appendTo);

        equal($.trim(tw.$el.find('[name=cancel_btn]').text()),
            allStrings.footer.cancel);
        equal($.trim(twwob.$el.find('[name=cancel_btn]').text()), 'geeeeeee');
        start();
    });

    asyncTest('validation', function() {
        var m, appendTo = '#qunit-fixture',
            tw = TestWizard({
                templates: {fieldsets: testTemplate}
            }).appendTo(appendTo);

        tw.set('model', m = window.m = Resource());
        ok(true);

        start();
    });

    asyncTest('validate error on previous pane', function() {
        var m, ml, appendTo = 'body',
            tw = window.tw = TestWizard({
                templates: {fieldsets: testTemplate}
            }).appendTo(appendTo);

        tw.set('model', m = window.m = Resource());
        tw.show();
        tw.getWidget('name').setValue('foo');
        tw.getWidget('composition.type').setValue('attribute-filter');
        tw.getWidget('next').trigger('click');
        tw.getWidget('required_field').setValue('required value');
        tw.getWidget('submit').trigger('click');
        equal(tw.get('currentPane', 0), 0);
        ml = tw.getWidget('composition.expression').options.messageList;

        equal(ml.$node.text(), 'Cannot be blank.');
        ok(ml.$node.is(':visible'));

        start();
    });

    asyncTest('validate error on last pane', function() {
        var m, ml, appendTo = 'body',
            tw = TestWizard({
                templates: {fieldsets: testTemplate}
            }).appendTo(appendTo);
        tw.set('model', m = window.m = Resource());
        tw.show();

        tw.getWidget('name').setValue('foo');
        tw.getWidget('composition.type').setValue('attribute-filter');
        tw.getWidget('composition.expression').setValue('some value');

        tw.getWidget('next').trigger('click');
        // do no set required field on last pane, but allow submission
        tw.get('widgets').submit.$node.attr('disabled', false);
        tw.get('widgets').submit.$node.removeClass('disabled');
        tw.getWidget('submit').trigger('click');

        equal(tw.get('currentPane', 0), 1);

        start();
    });

    // TODO: write tests for corner cases:
    //  - calling model.set() w/ an invalid value after the value was already
    //    set to something valid
    //       - show errors on those fields
    //       - disable the 'next' button
    //  - validating the model when next/save is clicked
    //       - should validate the whole model for save, visible fields for
    //         next
    //       - how do we propagate those errors back to the UI?
    //  - error on save throws the user back to the pane where the error was
    //    found
    //  - when .show() is called, the fields' message lists are hidden
    //    instantly, not animated

    start();
});
