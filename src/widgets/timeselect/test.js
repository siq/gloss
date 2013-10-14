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

    test('Instantiation', function() {
        var t = TimeSelect();
        t.appendTo($('body'));
        ok(true);
    });
    start();
});
