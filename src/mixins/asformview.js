define([
    'vendor/jquery'
], function($) {
    /*  This is a mixin that defines the interface needed to support form functionality
        You will want to override `getValue` and `setValue`.
        `clearStatus` and `setStatus` apply to the messageList if there is
        one and those will typically work without being overriden
        (as long as your markup is correct).

        In most cases you'll also want to trigger a 'change' so that validation and
        setting model properties will happen as expected.
        I've commented out code as an example as what this might look like but there's
        no generic solution for this.
    */
    function asFormView(opts) {
        // this.init = _.wrap(this.init, function(init) {
        //     _.bindAll(this, '_onChangeViewValue');
        //     return init.apply(this, _.rest(arguments, 1));
        // });

        // this._onChangeFormValue = function(evtName, xhr, model, changed) {
        //     this.trigger('change');
        // };

        if (!this.clearStatus) {
            this.clearStatus = function(opts) {
                var messageList = this.get('messageList'),
                    classes = this.$el.attr('class').split(' ');

                if (messageList) {
                    messageList.clear(opts);
                }
                classes = _.without(classes, 'invalid', 'valid');
                this.$el.attr('class', classes.join(' '));
                return this;
            };
        }
        if (!this.getValue) {
            this.getValue = function() {
                console.log('WARNING: You should override `getValue`');
            };
        }

        if(!this.setStatus) {
            this.setStatus = function(type, msg) {
                var messageList = this.get('messageList'),
                    classes = this.$el.attr('class').split(' ');

                if (messageList) {
                    messageList.clear();
                    if (type) {
                        messageList.append(type, msg);
                    }
                }
                classes.push(type);
                classes = _.uniq(classes);
                this.$el.attr('class', classes.join(' '));
                return this;
            };
        }

        if (!this.setValue) {
            this.setValue = function(v) {
                console.log('WARNING: You should override `setValue`');
            };
        }

        // this.update = _.wrap(this.update, function(update, changed) {
        //     if(changed.models) {
        //         this._onChangeFormValue();
        //     }
        //     return update.apply(this, _.rest(arguments, 1));
        // });
    }
    return asFormView;
});
