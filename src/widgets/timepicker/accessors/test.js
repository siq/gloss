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
            pos = 0,
            testfn = function(writeVal, expectedVal, expectedPos, accessMethod) {
                $input.write(writeVal);
                equal($input[accessMethod](), expectedVal, $input.val());
                equal($input.cursor(), expectedPos, $input.val());
            };
        $input.val(str);
        $input.cursor(0);

        testfn(0, 2, pos+1, 'hour');
        testfn(1, 1, pos+3, 'hour');
        testfn(1, 10, pos+4, 'minutes');
        testfn(2, 12, pos+6, 'minutes');
        testfn('P', 'PM', pos+7, 'meridian');
        testfn('N', 'PN', pos+8, 'meridian');
    });

    module('booleans');
    test('is_on', function() {
        $input.set_selection(0, 2);
        ok($input.is_on('hours'));
        ok(!$input.is_on('minutes'));
        ok(!$input.is_on('meridian'));

        $input.set_selection(4, 5);
        ok($input.is_on('minutes'));
        $input.set_selection(7, 8);
        ok($input.is_on('meridian'));
    });
    start();
});
