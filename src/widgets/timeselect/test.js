define([
    'vendor/jquery',
    './../timeselect'
], function($, TimeSelect) {
    'use strict';

    test('Manual', function() {
        var t = TimeSelect();
        t.appendTo($('body'));
        $('<input type=text></input>').appendTo($('body'));
        ok(true);
    });

    start();
});
