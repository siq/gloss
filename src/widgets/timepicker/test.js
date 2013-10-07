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
        t.focus_handler(t, dummyEvent);
        fn(t);
        t.$el.remove();
    };
    test('Time picker formating', function() {
        tpTest(function(t) {
            equal(t.input.$node.val(), "12:00 AM");
        });
    });
   
    module('handlers');
    test('tab_handler', function() {
        tpTest(function(t) {
            t.tab_handler(t, dummyEvent, false);
            equal(t.input.$node.cursor(), 3);
        });
    });
    test('up_arrow_handler', function() {
        tpTest(function(t) {
            _.each(_.range(1, 13), function(i) {
                t.up_arrow_handler(t, dummyEvent);
                equal( Number(t.input.$node.hour()), i);
            });
            // Verify roll over
            t.up_arrow_handler(t, dummyEvent);
            equal( Number(t.input.$node.hour()), 1);
        });
    });
    test('down_arrow_handler', function() {
        tpTest(function(t) {
            _.each(_.range(1, 12).reverse(), function(i) {
                t.down_arrow_handler(t, dummyEvent);
                equal( Number(t.input.$node.hour()), i );
            });
        });
    });
    test('left_arrow_handler', function() {
        tpTest(function(t) {
            t.input.$node.cursor(4);
            t.left_arrow_handler(t, dummyEvent);
            equal(t.input.$node.cursor(), 0);
        });
    });
    test('right_arrow_handler', function() {
        tpTest(function(t) {
            t.right_arrow_handler(t, dummyEvent);
            equal(t.input.$node.cursor(), 3);
        });
    });
    test('digit_entry', function() {
        tpTest(function(t) {
            t.digit_entry(t, 0, 1);
            equal(t.getValue().hours, 12);
//            equal(t.input.$node.cursor(), 1); // This is failing in ie8
            t.digit_entry(t, 1, 1);
            equal(t.getValue().hours, 11, 'Current value should be: 11:00 AM');
            t.digit_entry(t, 3, 4);
            equal(t.getValue().hours, 11, 'Current value should be: 11:40 AM');
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
    $(document).ready(function() {
        manual.input.$node.time('12', '00', "AM");
    });
    start();
});
