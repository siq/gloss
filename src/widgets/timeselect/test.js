define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './../timeselect'
], function($, _, moment, TimeSelect) {
    'use strict';

    var ts = TimeSelect(null, true);

    test('duexgetize', function() {
        equal(ts._duexgitize(1), '01');
        equal(ts._duexgitize(12), '12');
        equal(ts._duexgitize(10), '10');
    });

    test('generate_time_strings', function() {
        var hours = ['01', '02', '03'],
            minutes = ['00', '15', '30', '45'],
            timeStrings = ts._generate_time_strings(hours, minutes, false);
        /* strings generated with flag set to 12 hour clock */
        equal(timeStrings.length, 2*(hours.length * minutes.length));
        _.each(timeStrings, function(str) {
            equal(str.length, 'hh:mm AM'.length);
            equal(str.indexOf(':'), 2);
        });
        /* strings generated with flag set to 24 hour clock */
        timeStrings =  ts._generate_time_strings(hours, minutes, true);
        equal(timeStrings.length, (hours.length * minutes.length));
        _.each(timeStrings, function(str) {
            equal(str.length, 'hh:mm'.length);
            equal(str.indexOf(':'), 2);
        });
    });

    test('generate_time_options', function() {
        var parentNode = '<ol class=time-options></ol>',
            twelveHourTemplate = '<li>hh:mm AM</li>',
            twentyFourHourTemplate = '<li>hh:mm</li>',
            options = ts._generate_time_options(30, false);
        equal(options.length, 12*2*2*twelveHourTemplate.length + parentNode.length);
        options = ts._generate_time_options(30, true),
        equal(options.length, 12*2*twentyFourHourTemplate.length + parentNode.length);
    });

    (function() {
        var twelve = '03:04 AM',
            twentyfour = '23:12',
            tokens12 = ts._tokenize(twelve, false),
            tokens24 = ts._tokenize(twentyfour, true),
            parsed12 = ts._parse_time(twelve, false),
            parsed24 = ts._parse_time(twentyfour, true);
        test('tokenize', function() {
            equal(tokens12[0], '03');
            equal(tokens12[1], '04');
            equal(tokens12[2], 'AM');
            equal(tokens24[0], '23');
            equal(tokens24[1], '12');
            equal(tokens24[2], null);
        });
        test('parse_time', function() {
            equal(parsed12.hours, 3);
            equal(parsed12.minutes, 4);
            equal(parsed12.meridian, 'AM');
            equal(parsed24.hours, 23);
            equal(parsed24.minutes, 12);
            equal(parsed24.meridian, null);
        });
        test('validate', function() {
            ok(ts._validate('03:30 PM', false));
            ok(ts._validate('03:00 PM', false));
            ok(ts._validate('12:00 PM', false));

            ok(ts._validate(twelve, false));
            ok(ts._validate(twentyfour, true));
            ok(!ts._validate('ab:cd: 34', true));
            ok(!ts._validate('ab cd__ b', true));

            ok(!ts._validate('11:cd: AM', true));
            ok(!ts._validate('ab:10: AM', true));
            ok(!ts._validate('ab/10: AM', true));
            ok(!ts._validate('ab&10: AM', true));
        });
        test('setValue', function() {
            var strTimeOne = "2013-11-15T22:00:00Z",
                strTimeTwo = "2013-11-15T03:45:00",
                dTime = new Date(),
                minuteOffset = dTime.getTimezoneOffset();

            ts.setValue(strTimeOne);
            equal(ts.getValue().hours, (dTime.getHours()===12) ? 12 : (22 - Math.floor(minuteOffset/60)) % 12);
            equal(ts.getValue().minutes, 0 + minuteOffset%60);
            equal(ts.getValue().meridian, 'PM');

            ts.setValue(strTimeTwo);
            equal(ts.getValue().hours, 3);
            equal(ts.getValue().minutes, 45);
            equal(ts.getValue().meridian, 'AM');

            ts.setValue(dTime);
            equal(ts.getValue().hours, (dTime.getHours()===12) ? 12 : dTime.getHours()%12);
            equal(ts.getValue().minutes, dTime.getMinutes());
            equal(ts.getValue().meridian, moment().format('A'));
        });
    })();


    test('manual', function() {
        var t = TimeSelect();
        t.appendTo($('body'));
        $('<input type=text></input>').appendTo($('body'));
        ok(true);
    });

    start();
});
