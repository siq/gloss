define([
    'vendor/jquery',
    'vendor/underscore',
    './simpleview',
    './../util/format',
    'text!./progress/progress.mtpl',
    'css!./progress/progress.css'
], function ($, _, SimpleView, format, template) {

    return SimpleView.extend({
        defaults: {
            // how much work the task indicated by the progress view requires.
            max: 1,
            // value: how much of the task that has been completed.
            // It must be a valid floating point number between 0 and max, or between 0 and 1 if max is omitted
            value: 0
        },
        template: template,

        _clamp: function(value) {
            var ret,
                min = 0,
                max = this.has('max') ? this.get('max') : this.defaults.max;

            ret = Math.min(Math.max(value, min), max);
            if (_.isNaN(ret)) {
                throw Error('"value" must be of type "number" recieved type: "' + typeof value + '"');
            }
            return ret;
        },
        getValue: function() {
            return this.get('value');
        },
        set: function(/*arguments*/) {
            var args = arguments,
                prop = arguments[0],
                value = arguments[1];

            // clamp the value between 0 - `max`
            if (_.isString(prop) && prop === 'value') {
                args[1] = this._clamp(value);
            } else if (_.isObject(prop) && _.contains(_.keys(prop), 'value')) {
                prop['value'] = this._clamp(prop['value']);
            }
            return this._super.apply(this, args);
        },
        setValue: function(progress) {
            this.set('value', progress);
            return this;
        },
        update: function(updated) {
            var self = this,
                progress, max;

            this._super.apply(this, arguments);

            if (updated.value) {
                progress = this.get('value');

                this.waitForInitialRender.then(function() {
                    var max = self.get('max');
                    self.$el.find('.progress-value').width(format.percent(progress/max, 2));
                    // since we're moving from the right (max - progress)/max
                    self.$el.find('.divider').css('right', format.percent((max - progress)/max, 2));
                    self.$el.attr('value', progress);
                });
            }
            if (updated.max) {
                max = this.get('max');
                this.waitForInitialRender.then(function() {
                    self.$el.attr('max', max);
                    // when the max changes the precentage of the width will change
                    // so just re-set the value and the calc will be handled
                    // this will also apply the `clamp` if needed
                    self.set('value', self.get('value'), {update: true});
                });
            }
            return this;
        }
    });
});
