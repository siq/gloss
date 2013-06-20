/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore'
], function($, _) {

    function assertFieldHasError(form, prop, token) {
        var w = form.getWidget(prop),
            nonnullString = 'Cannot be blank.',
            messageListMsg = $.trim(w.options.messageList.$node.text()),
            message = (token === 'blanktexterror' || token === 'nonnull') ?
                nonnullString : '';

        ok(w.$node.hasClass('invalid'), 'field has "invalid" class');
        equal(messageListMsg, message);
    }

    function assertFieldHasNoError(form, prop) {
        var w = form.getWidget(prop);
        ok(!w.$node.hasClass('invalid'), 'field doesn\'t have "invalid" class');
        equal($.trim(w.options.messageList.$node.text()), '');
    }

    function assertNoErrors(form) {
        equal(form.$el.find('.invalid').length, 0, 'nothing has an "invalid" class');
        _.each(form.bindingGroups, function(group, name) {
            _.each(group.bindings, function(binding) {
                var w = binding.get('widget'),
                    m = w && w.options.messageList;
                equal($.trim(m.$node.text()), '');
            });
        });
    }

    function typeTextInField(form, prop, value) {
        var w = form.getWidget(prop);
        w.$node.val(value);
        w.$node.trigger($.Event('keyup'));
        w.setValue(value);
    }

    return {
        assertFieldHasError: assertFieldHasError,
        assertFieldHasNoError: assertFieldHasNoError,
        assertNoErrors: assertNoErrors,
        typeTextInField: typeTextInField
    };
});
