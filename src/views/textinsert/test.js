/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/underscore',
    './../textinsert'
], function(_, TextInsert) {

    var show = function(textinsert) {
        textinsert.appendTo('body');
        textinsert.$el.find('table').css('width', '100%');
    };

    test('instantiate', function() {
        var ti = TextInsert();
        // show(ti);
        ok(ti);
    });
    test('setValue', function() {
        var ti = TextInsert(),
            values = ['term 1', 'term2', 'term 3'];
        // show(ti);
        ti.show();

        ti.setValue(values);
        ok(_.isEqual(ti.getValue(), values), 'get value is equal to set value');
    });
    test('add a value', function() {
        var ti = TextInsert(),
            value = 'new term';
        // show(ti);

        ti.getWidget('term-input').setValue(value);
        ti.getWidget('add').trigger('click');

        ok(_.isEqual(ti.getValue()[0], value), 'added a value');
    });
    test('remove a value', function() {
        var ti = TextInsert({
            terms: ['term 1', 'term2', 'term 3']
        });
        // show(ti);

        equal(ti.getValue().length, 3, 'textinsert has 3 values');
        ti._select(ti.get('models')[1]);
        ti.getWidget('remove').trigger('click');
        equal(ti.getValue().length, 2, 'a value was rmoved');
        ok(!_.contains(ti.getValue(), 'term2'), 'the right term was removed');
        ok(ti.get('models')[1][ti.get('selectedAttr')],
            'the next model is selected after on is removed');
    });
    test('remove all values', function() {
        var ti = TextInsert({
            terms: ['term 1', 'term2', 'term 3']
        });
        // show(ti);

        equal(ti.getValue().length, 3, 'textinsert has 3 values');
        ti.getWidget('remove-all').trigger('click');
        equal(ti.getValue().length, 0, 'all values were removed');
    });
    test('visual test ... play with me!', function() {
        var ti = TextInsert({
            terms: ['term 1', 'term2', 'term 3']
        });
        show(ti);
        ok(ti);
    });
    start();
});