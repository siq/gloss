define([
    'vendor/underscore',
    'vendor/moment',
    './../mixins/aswidgetizable',
    './../widgets/selectbox',
    './../widgets/datepicker',
    './../widgets/simpleview',
    'tmpl!./daterange/daterange.mtpl',
    'css!./daterange/daterange.css'
], function(_, moment, asWidgetizable, SelectBox, DatePicker,
    SimpleView, template) {
    'use strict';

    var DateRange = SimpleView.extend({
        template: template,
        defaults: {
            options: [
                'less-than',
                'greater-than',
                'equal',
                'between'
            ],
            animationDuration: 200
        },

        _initWidgets: function() {
            var ret = this._super.apply(this, arguments);
            this.$to = this.$el.find('.to');
            this.$to.hide();
            return ret;
        },
        _bindEvents: function() {
            var self = this,
                ret = this._super.apply(this, arguments);

            _.bindAll(this, '_dateFilterChanged');
            this.on('change', '[name=date-range-type]', this._dateFilterChanged);
            this.on('change', '[name=from-date]', function() {
                var fromDateWidget = self.getWidget('from-date'),
                    toDateWidget = self.getWidget('to-date'),
                    fromDate = moment(fromDateWidget.getValue()),
                    toDate = moment(toDateWidget.getValue()),
                    diff = (fromDate && toDate) ? fromDate.diff(toDate) : null;

                // diff > 0 - fromDate > toDate
                if (fromDate && toDate && diff > 0) {
                    toDateWidget.setValue(fromDate);
                }
            });
            this.on('change', '[name=to-date]', function() {
                var fromDateWidget = self.getWidget('from-date'),
                    toDateWidget = self.getWidget('to-date'),
                    fromDate = moment(fromDateWidget.getValue()),
                    toDate = moment(toDateWidget.getValue()),
                    diff = (fromDate && toDate) ? toDate.diff(fromDate) : null;

                // diff < 0 - toDate < fromDate
                if (fromDate && toDate && diff < 0) {
                    fromDateWidget.setValue(toDate);
                }
            });
            return ret;
        },
        _dateFilterChanged: function(evt) {
            var rangeType = this.getWidget('date-range-type'),
                value = rangeType.getValue();

            if (value === 'between' && this.$to.css('display') === 'none') {
                this.$to.animate({
                    height: 'toggle'
                }, this.get('animationDuration'));
            } else if (this.$to.css('display') !== 'none') {
                this.$to.animate({
                    height: 'toggle'
                }, this.get('animationDuration'));
            }
        },
        clearValue: function() {
            this.getWidget('from-date').setValue();
            this.getWidget('to-date').setValue();
            return this;
        }
    });

    asWidgetizable.call(DateRange.prototype);

    return DateRange;
});