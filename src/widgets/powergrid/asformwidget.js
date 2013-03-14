define([
    'vendor/jquery',
    'vendor/underscore'
], function($, _) {
    function asFormWidget(opts) {
        var selectable = this.defaults.selectable || true,
            prop = (opts && opts.prop) || 'id';

        this.defaults = $.extend(true, this.defaults, {selectable: selectable});

        this.init = _.wrap(this.init, function(init) {
            _.bindAll(this, '_onChangeFormValue');
            return init.apply(this, _.rest(arguments, 1));
        });

        this._onChangeFormValue = function() {
            this.trigger('change');
        };

        this.getValue = function() {
            var m = this.selected();
            return m && m.get(prop);
        };

        this.setValue = function(newValue) {
            var attr = this.get('selectedAttr');
            newValue = _.isArray(newValue)? newValue : [newValue];
            this.select(_.find(this.get('models'), function(m) {
                return _.indexOf(newValue, m.get(prop)) >= 0;
            }));
            return this;
        };

        this.update = _.wrap(this.update, function(update, changed) {
            if (changed.collection) {
                if (this.previous('collection')) {
                    this.previous('collection').off('change', this._onChangeFormValue);
                }
                if (this.get('collection')) {
                    this.get('collection').on('change', this._onChangeFormValue);
                }
            }
            return update.apply(this, _.rest(arguments, 1));
        });
    }
    return asFormWidget;
});
