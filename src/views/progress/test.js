/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
define([
    'vendor/jquery',
    './../progress'
], function ($, Progress) {

    test('Object instantiation', function () {
        var p = Progress()
            // .appendTo('#qunit-fixture');
            .appendTo('body')
            .setValue(0.5);

        ok(p);
        start();
    });

    module('base functionality');

    test('$el value prop matches value option', function () {
        var p = Progress()
            .appendTo('#qunit-fixture');
            // .appendTo('body');

        // defaut is 0-1
        // setValue interface
        p.setValue(0.7);
        equal(p.getValue(), p.$el.val(), 'option value === $el.val');

        // assettable interface
        p.set('value', 0.5);
        equal(p.getValue(), p.$el.val(), 'option value === $el.val');

        p.set({value: 0.3});
        equal(p.getValue(), p.$el.val(), 'option value === $el.val');

        start();
    });

    test("$el value and option maximum are bound by 'max' option", function () {
        var p = Progress()
            .appendTo('#qunit-fixture');
            // .appendTo('body');

        // defaut is 0-1
        // setValue interface
        p.setValue(10);
        equal(p.get('max'), 1, 'max is 1');
        equal(p.getValue(), p.get('max'), 'value option maximum is bound by max option');
        equal(p.$el.val(), p.get('max'), '$el value prop maximum is bound by max option');

        // assettable interface
        p.set('value', 20);
        equal(p.get('max'), 1, 'max is 1');
        equal(p.getValue(), p.get('max'), 'value option maximum is bound by max option');
        equal(p.$el.val(), p.get('max'), '$el value prop maximum is bound by max option');

        p.set({value: 30});
        equal(p.get('max'), 1, 'max is 1');
        equal(p.getValue(), p.get('max'), 'value option maximum is bound by max option');
        equal(p.$el.val(), p.get('max'), '$el value prop maximum is bound by max option');

        start();
    });

    test("$el value and option minimum are bound by '0'", function () {
        var p = Progress()
            .appendTo('#qunit-fixture');
            // .appendTo('body');

        // defaut is 0-1
        // setValue interface
        p.setValue(-10);
        equal(p.getValue(), 0, 'value option minimum is "0"');
        equal(p.$el.val(), 0, '$el value prop minimum is "0"');

        // assettable interface
        p.set('value', -20);
        equal(p.getValue(), 0, 'value option minimum is "0"');
        equal(p.$el.val(), 0, '$el value prop minimum is "0"');

        p.set({value: -30});
        equal(p.getValue(), 0, 'value option minimum is "0"');
        equal(p.$el.val(), 0, '$el value prop minimum is "0"');

        start();
    });

    test("Only number values can be set", function () {
        var p = Progress()
            .appendTo('#qunit-fixture');
            // .appendTo('body');

        // defaut is 0-1
        // setValue interface
        try {
            p.setValue('foo');
            ok(false, "shouldn't be able to set a string value");
        } catch (e) {
            ok(true, "value must be a number");
        }

        // assettable interface
        try {
            p.set('value', 'bar');
            ok(false, "shouldn't be able to set a string value");
        } catch (e) {
            ok(true, "value must be a number");
        }

        try {
            p.set({value: 'baz'});
            ok(false, "shouldn't be able to set a string value");
        } catch (e) {
            ok(true, "value must be a number");
        }

        start();
    });

    module('edge cases');

    test("changing the max a run-time is allowed", function () {
        var p = Progress()
            .appendTo('#qunit-fixture');
            // .appendTo('body');

        // defaut is 0-1
        p.setValue(70);
        equal(p.getValue(), p.$el.val(), 'option value === $el.val');
        equal(p.getValue(), 1, 'equal to maximum');
        equal(p.$el.val(), 1, 'equal to maximum');

        // change the allowed maximum
        p.set('max', 100);

        // if we didn't clamp the option value then it would already be equal to 70
        // and would not trigger a change. i.e. p.$el.val !== p.option.value
        p.setValue(70);
        equal(p.getValue(), p.$el.val(), 'option value === $el.val');
        equal(p.getValue(), 70, 'equal to overflow after allowing an increased max');
        equal(p.$el.val(), 70, 'equal to overflow after allowing an increased max');

        start();
    });
     
     test("value is re-set when max changes", function () {
        var p = Progress()
            .appendTo('#qunit-fixture');
            // .appendTo('body');

        // the percentage of the width will be different when the max changes
        // so it needs to be re-set so the progress percentage (width) is correct

        // 50%
        // 0.5/1 = 0.5 = 50%
        p.setValue('0.5');
        equal(p.get('value')/p.get('max'), 0.5, '50%');

        // 25%
        // setting max = 2 reduces the percentage
        // 0.5/2 = 0.25 = 25%
        p.set('max', 2);
        equal(p.get('value')/p.get('max'), 0.25, '25%');

        // 100%
        // setting max = 0.5 increases the percentage
        // 0.5/0.5 = 1 = 100%
        p.set('max', 0.5);
        equal(p.get('value')/p.get('max'), 1, '100%');

        start();
    });

     test('value is clamped when max changes below value', function() {
        var p = Progress()
            .appendTo('#qunit-fixture');
            // .appendTo('body');

        // 100%
        // 1/1 = 1 = 100%
        p.setValue('1');
        equal(p.get('value')/p.get('max'), 1, '100%');

        // 200% clamped to 100%
        // 1/0.5 = 1 = 200%
        p.set('max', 0.5);
        equal(p.get('value')/p.get('max'), 1, '100% clamped');
        // all values where clamped
        equal(p.getValue(), p.$el.val(), 'option value === $el.val');
        equal(p.getValue(), 0.5, 'clamped to new max');
        equal(p.$el.val(), 0.5, 'clamped to new max');
     });

    start();
});
