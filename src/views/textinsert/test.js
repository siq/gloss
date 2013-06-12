/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    './../textinsert'
], function(TextInsert) {

    test('instantiate', function() {
        var ti = TextInsert();
        ti.appendTo('body');

        ok(ti);
    });
    start();
});