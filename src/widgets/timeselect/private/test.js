define([
    'vendor/jquery',
    'vendor/underscore',
    './../private'
], function($, _, priv) {
    'use strict';

    test('duexgetize', function() {
        equal(priv.duexgitize(1), '01'); 
        equal(priv.duexgitize(12), '12'); 
        equal(priv.duexgitize(10), '10'); 
    });

    test('generate_time_strings', function() {
        var hours = ['01', '02', '03'],
            minutes = ['00', '15', '30', '45'],
            timeStrings = priv.generate_time_strings(hours, minutes, false);
        /* strings generated with flag set to 12 hour clock */
        equal(timeStrings.length, 2*(hours.length * minutes.length));
        _.each(timeStrings, function(str) {
            equal(str.length, 'hh:mm AM'.length);
            equal(str.indexOf(':'), 2);
        });
        /* strings generated with flag set to 24 hour clock */
        timeStrings =  priv.generate_time_strings(hours, minutes, true);
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
            options = priv.generate_time_options(30, false);
        equal(options.length, 12*2*2*twelveHourTemplate.length + parentNode.length);
        options = priv.generate_time_options(30, true),
        equal(options.length, 12*2*twentyFourHourTemplate.length + parentNode.length);
    });
    
    (function() {
        var twelve = '03:04 AM',
            twentyfour = '23:12',
            tokens12 = priv.tokenize(twelve, false), 
            tokens24 = priv.tokenize(twentyfour, true),
            parsed12 = priv.parse_time(twelve, false), 
            parsed24 = priv.parse_time(twentyfour, true);
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
            ok(priv.validate(twelve, false));
            ok(priv.validate(twentyfour, true));
            ok(!priv.validate('ab:cd: 34', true));
            ok(!priv.validate('ab cd__ b', true));
        });
    })();
    start();
});
