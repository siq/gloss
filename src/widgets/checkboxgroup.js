define([
    'vendor/underscore',
    './formwidget',
    './collectionviewable',
    './checkbox',
    'tmpl!./checkboxgroup/checkboxgroup.mtpl'
], function(_, FormWidget, CollectionViewable, CheckBox, template) {
    return FormWidget.extend({
        defaults: {
            template: template,
            translate: function(model, checked) {
                return {name: model.name, value: model.id};
            }
        },

        create: function() {
            var self = this;
            this._super();
            this.$node.find('input[type=checkbox]').each(function(i, el) {
                if (!self.registry.isWidget(el)) {
                    (self.checkboxes = self.checkboxes || []).push(CheckBox(el));
                }
            });
            this.update();
        },

        getValue: function() {
            return _.filter(
                _.map(this.checkboxes, function(cb) {
                    return cb.getValue()? cb.options.value : null;
                }),
                function(v) { return v !== null; }
            );
        },

        setValue: function(array, silent) {
            var cur = this.getValue().sort();
            if (_.isString(array)) {
                if (array === 'all') {
                    array = _.map(this.checkboxes, function(cb) {
                        return cb.options.value;
                    });
                } else {
                    array = [];
                }
            }
            array = array.slice(0).sort();

            if (!_.isEqual(cur, array)) {
                _.each(this.checkboxes, function(cb) {
                    var value = _.indexOf( array, cb.options.value );
                    cb.setValue(value >= 0, true);
                });
                if (!silent) {
                    this.trigger('change');
                }
            }
            return this;
        },

        _readCheckboxState: function() {
            var checkboxes = [];
          _.each(this.options.entries,
                 function( entry, i ) {
                     checkboxes.push( (entry!=undefined && entry.checked) ? true : false );
                 });
            return checkboxes;
        },

        _applySavedCheckboxState: function(checkedEntries) {
           var entries = _.map( this.options.models, this.options.translate );
          _.each(entries,
                function( entry, i ) {
                    if(entry != undefined) {
                        entry.checked = checkedEntries[i];
                    }
                });
            return entries;
        },

        updateWidget: function(updated) {
            var options = this.options, checkboxes;

          var checkedEntries = this._readCheckboxState();

            if (updated.models) {
                var entries = this._applySavedCheckboxState(checkedEntries);
                this.set('entries', entries );
            }

            if (updated.entries) {
                _.each(this.checkboxes || [], function(cb) { cb.destroy(); });
                this.checkboxes = checkboxes = [];
                this.$node.html(options.template(this))
                    .find('input[type=checkbox]').each(function(i, el) {
                        checkboxes.push(CheckBox(el, {
                            value: options.entries[i].value,
                            name: options.entries[i].name,
                            initialValue: checkedEntries[i]
                        }));
                    });
            }


        }
    }, {mixins: [CollectionViewable]});
});
