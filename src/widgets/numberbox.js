define([
    'vendor/jquery',
    'vendor/underscore',
    './formwidget'
], function($, _, FormWidget) {
    /* Utilities to push the post-decimal values of a floating point number into the integer component of a float.
     * Prevents floating point errors on a modulo operation */
    var priv = new function() {
        this._read_precision = function(num) {
            var numStr = String(num),
                index = numStr.indexOf('.');
            return (!isNaN(num) && index !== -1) ? (numStr.split('.')[1].length) : 0;
        };
        this._destroy_mantissa = function(num) {
            var prec = this._read_precision(num);
            return (prec===-1 || prec===0) ? num : num * Math.pow(10, prec);
        };
        this._mod_float = function(num, step) {
            var prec = this._read_precision(num),
                sprec = this._read_precision(step),
                tNum = this._destroy_mantissa(num) * Math.pow(10, sprec),
                tStep = this._destroy_mantissa(step) * Math.pow(10, prec),
                numerator = tNum%tStep,
                denominator = prec * sprec;
            return (denominator===0) ? numerator : numerator / denominator;
        };
        this._step_is_less_precise_than_input = function(num, step) {
            return (this._read_precision(num) > this._read_precision(step));
        };
        /* The assumption here is that if a step is provided, that step represents the lowest allowed unit of discriminiation
         * The mod float logic does not work for steps that are less precise than the input value */
        this._passes_constraints = function(num, constraints) {
            return ((!isNaN(num) && isFinite(num)) &&
                    ((constraints.min) ? (num >= constraints.min) : true) &&
                    ((constraints.max) ? (num <= constraints.max) : true) &&
                    ((constraints.step) ? (!this._step_is_less_precise_than_input(num, constraints.step)) : true) &&
                    ((constraints.step) ? (this._mod_float(num, constraints.step) === 0) : true));
        };
    };
    /**
     * This widget only supports numbers with an absolute value less than 9007199254740992 when the number's decimal point is removed,
     * and when the precision of a specified step is added to the precision of the input field.
     * Example - value: 10.001 with a step: 0.000001 is represented as 10001000000 during step validation.
     */
    var NumberBox = FormWidget.extend({
        nodeTemplate: '<input type=number>',
        defaults: {
            placeholder: null
        },
        create: function() {
            this._super.apply(this, arguments);
            this.options.min = this.$node.attr('min'),
            this.options.max = this.$node.attr('max'),
            this.options.step = this.$node.attr('step');

        },
        getContraints: function() {
            return {min: this.options.min, max: this.options.max, step: this.options.step};
        },
        setValue: function(val) {
            if(priv._passes_constraints(Number(val), this.getContraints()) || val=== '') {
                this._super.apply(this, arguments);
            }
        },
        getValue: function() {
            var value = this._super.apply(this, arguments);
            return (value !== '') ? value : null;
        }
    });
    return function(opts, withPrivate) {
        return (withPrivate) ? _.extend(NumberBox.extend(opts)(), priv) : NumberBox.extend(opts)();
    };
});
