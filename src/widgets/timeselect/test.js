define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './../timeselect'
], function($, _, moment, TimeSelect) {
    'use strict';
    var dummyEvent = {preventDefault: function() {
        /* do nothing */
    }};

    test('Manual', function() {
        var t = TimeSelect();
        t.appendTo($('body'));
        $('<input type=text></input>').appendTo($('body'));
        ok(true);
    });

    start();
});
