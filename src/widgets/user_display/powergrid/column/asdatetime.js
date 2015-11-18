define([
    'vendor/moment',
    './../column'
], function(moment, Column) {
    return function asDateTime(options) {
        if (options && options.prototype && options.extend) {
            asDateTime.apply(options.prototype,
                Array.prototype.slice.call(arguments, 1));
            return options;
        }
        this.formatValue = function(value, model) {
            var fmt = this.get('strings.datetime_format') || 'YYYY-MM-DD h:mm A';
            return value? moment(value).format(fmt) : '';
        };
    };
});
