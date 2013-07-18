/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../asformview',
    './../../views/textinsert'
], function($, asFromView, TextInsert) {

    asyncTest('views inherit the fromwidget api', function() {
        var ti, TI = TextInsert.extend();
        asFromView.call(TI.prototype);

        ti = TI().appendTo('body');
        ok(ti);
        start();
    });

    start();

});

