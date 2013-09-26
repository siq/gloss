/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './../timepicker'
], function($, _, moment, TimePicker) {
    'use strict';
    var dummyEvent = {preventDefault: function() {
        /* do nothing */
    }};

    var tpTest = function(fn) {
        var t = TimePicker();
        t.prependTo($('body'));
        t.input.$node.time('12', '00', 'AM');
        t.focus_handler(dummyEvent);
        fn(t);
        t.$node.remove();
    };
    test('Time picker formating', function() {
        tpTest(function(t) {
            equal(t.input.$node.val(), "12:00 AM");
        });
    });
   
    module('handlers');
    test('tab_handler', function() {
        tpTest(function(t) {
            t.tab_handler(dummyEvent);
            equal(t.input.$node.cursor(), 3);
        });
    });
    test('up_arrow_handler', function() {
        tpTest(function(t) {
            _.each(_.range(1, 13), function(i) {
                t.up_arrow_handler(dummyEvent);
                equal( Number(t.input.$node.hour()), i);
            });
            // Verify roll over
            t.up_arrow_handler(dummyEvent);
            equal( Number(t.input.$node.hour()), 1);
        });
    });
    test('down_arrow_handler', function() {
        tpTest(function(t) {
            _.each(_.range(1, 12).reverse(), function(i) {
                t.down_arrow_handler(dummyEvent);
                equal( Number(t.input.$node.hour()), i );
            });
        });
    });
    test('left_arrow_handler', function() {
        tpTest(function(t) {
            t.input.$node.cursor(4);
            t.tab_handler(dummyEvent, true);
            equal(t.input.$node.cursor(), 0);
        });
    });
    test('right_arrow_handler', function() {
        tpTest(function(t) {
            t.tab_handler(dummyEvent);
            equal(t.input.$node.cursor(), 3);
        });
    });
    test('is_digit', function() {
        tpTest(function(t) {
            ok( !t.is_digit({keyCode: 10}) );
            ok( t.is_digit({keyCode: 47}) );
        });
    });
    
    var manual = TimePicker();
    manual.prependTo($('body'));
    manual.input.$node.time('12', '00', "AM");
    start();
});
