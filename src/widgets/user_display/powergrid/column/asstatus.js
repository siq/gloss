define([
    'vendor/jquery',
    'vendor/underscore',
    './../column'
], function($, _, Column) {

    return function asStatus(opts) {
        if (opts && opts.prototype && opts.extend) {
            asStatus.apply(opts.prototype,
                Array.prototype.slice.call(arguments, 1));
            return opts;
        }

        this.cssClasses = _.wrap(this.cssClasses, function(func, model) {
            // add status value to CSS, to handle value specific formating 
            var classes = func.apply(this, Array.prototype.slice.call(arguments, 1));
            return model ? this.getValue(model) + ' ' + classes : classes;
        });
    };

});

