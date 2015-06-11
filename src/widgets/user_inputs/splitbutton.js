define([
    'vendor/jquery',
    'vendor/underscore',
    './button'
], function($,_, Button) {
    return Button.extend({
        defaults: {
            messageList: false
        },
        create: function() {
            this._super();
            if (!this.options.nostyling) {
                this.$node.addClass('split-button');
            }
            this.$leftNode = $('<span class="split-button-element split-button-left"></span>');
            this.$rightNode = $('<span class="split-button-element split-button-right"></span>');
            this.$node.append([this.$leftNode,this.$rightNode]);
            return this;
        },
        _isEqual:function(value){
            var currentValue = this.getValue() || [];
            return _.isEqual(currentValue,value);
        },

        getValue: function() {
            return [this.$leftNode.text(),this.$rightNode.text()];
        },


        /*`value` should be an array of length 2. value[0] is set on the left button and value[1] on the right*/
        /* `value` can also be a comma separated string that can be split into an array*/
        setValue: function(value, silent) {
            var newValue = _.isArray(value) ? value : value.split(',');
            var lValue;
            var rValue;
            if (!this._isEqual(newValue)) {
                lValue = newValue[0] || '';
                rValue = newValue[1] || '';
                this.$leftNode.text(lValue).attr('title',lValue);
                this.$rightNode.text(rValue).attr('title',rValue);
                if (!silent) {
                    this.trigger('change');
                }
            }
            return this;
        }
    });
});