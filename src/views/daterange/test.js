/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/underscore',
    'vendor/moment',
    './../daterange'
], function(_, moment, DateRange) {

    test('instantiate', function() {
        var dr = DateRange();
        dr.appendTo('body');

        ok(dr);
    });

    test('to date is only shown when between type is selected', function() {
        var dr = DateRange(),
            $to = dr.$el.find('.to');

        equal($to.css('display'), 'none', 'to date section is hidden');
        dr.getWidget('date-range-type').setValue('between');
        equal($to.css('display'), 'block', 'to date section is hidden');
    });

    test('to-date tracks from-date when from-date > to-date', function() {
        var dr = DateRange(),
            fromDate = dr.getWidget('from-date'),
            toDate = dr.getWidget('to-date'),
            date;

        dr.getWidget('date-range-type').setValue('between');

        toDate.setValue('2011-01-01');
        fromDate.setValue('2011-01-20');
        ok(moment(toDate.getValue()).diff(moment(fromDate.getValue())) === 0,
            'to-date track from-date');

        date = moment(toDate.getValue());
        equal(date.year(), '2011', 'year is equal');
        equal(date.month(), '0', 'month is equal'); // zero indexed
        equal(date.date(), '20', 'day is equal'); // date is the day, day is the day of the week
    });

    test('from-date tracks to-date when to-date < from-date', function() {
        var dr = DateRange(),
            fromDate = dr.getWidget('from-date'),
            toDate = dr.getWidget('to-date'),
            date;

        dr.getWidget('date-range-type').setValue('between');

        fromDate.setValue('2011-01-20');
        toDate.setValue('2011-01-01');
        ok(moment(toDate.getValue()).diff(moment(fromDate.getValue())) === 0,
            'from-date track to-date');

        date = moment(fromDate.getValue());
        equal(date.year(), '2011', 'year is equal');
        equal(date.month(), '0', 'month is equal'); // zero indexed
        equal(date.date(), '01', 'day is equal'); // date is the day, day is the day of the week
    });

    start();
});