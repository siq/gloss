define([
    'vendor/jquery',
    'vendor/underscore',
    './../accessors'
], function($, _, accessors) {
    var $input = (function() {
        $('body').prepend('<input id=test type=text/>');
        var $input = $('#test');
        $input.extend(new accessors());
        return $input;
    })();

    module('positioning');
    test('cursor', function() {
        var str = '12:00 AM',
            len = str.length;
        $input.val(str);
        for(var i=0; i<len; i++) {
            $input.cursor(i);
            equal(i, $input.cursor());
        }
    });

    module('highlighting');
    test('set_selection', function() {
        $input.set_selection(0, 2);
        equal($input[0].selectionStart, 0);
        equal($input[0].selectionEnd, 2);
    });
    test('coerce_selection', function() {
        $input = $input.coerce_selection(1);
        equal($input[0].selectionStart, 0);
        equal($input[0].selectionEnd, 2);
        $input = $input.coerce_selection(4);
        equal($input[0].selectionStart, 3);
        equal($input[0].selectionEnd, 5);
    });

    module('read/write');
    test('hour', function() {
        var str = '12:00 AM',
            len = str.length;
        $input.val(str);
        _.map(_.range(1, 13), function(i) {
            $input.hour(i);
            equal(i, $input.hour());
        });
    });
    test('minutes', function() {
        var str = '12:00 AM',
            len = str.length;
        $input.val(str);
        _.map(_.range(0, 59), function(i) {
            $input.minutes(i);
            equal(i, $input.minutes());
        });
    });
    test('meridian', function() {
        var str = '12:00 AM',
            len = str.length;
        $input.val(str);
        $input.meridian("PM");
        equal("PM", $input.meridian());
        $input.meridian("AM");
        equal("AM", $input.meridian());
    });
    test('write', function() {
        var str = '12:00 AM',
            len = str.length,
            pos = 0;
        $input.val(str);
        $input.cursor(0);

        $input.write(0);
        equal(2, $input.hour(), $input.val());
        equal(pos+1, $input.cursor(), $input.val());

        $input.write(1);
        equal(1, $input.hour(), $input.val());
        equal(pos+3, $input.cursor(), $input.val());
        
        $input.write(1);
        equal(10, $input.minutes(), $input.val());
        equal(pos+4, $input.cursor(), $input.val());

        $input.write(2);
        equal(12, $input.minutes(), $input.val());
        equal(pos+6, $input.cursor(), $input.val());

        $input.write("P");
        equal("PM", $input.meridian(), $input.val());
        equal(pos+7, $input.cursor(), $input.val());

        $input.write("N");
        equal("PN", $input.meridian(), $input.val());
        equal(pos+8, $input.cursor(), $input.val());
    });

    module('booleans');
    // to implement

    start();
});
