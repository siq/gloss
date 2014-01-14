define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'bedrock/class',
    'bedrock/mixins/assettable',
    './../widgets/base/widget',
    './widgetize',
    './binding'
], function($, _, t, Class, asSettable, Widget, widgetize, Binding) {
    var registry = Widget().registry;

    var BindingGroup = Class.extend({
        defaults: {
            name: 'main'
        },
        init: function(options) {
            this.bindings = [];
            this.set(_.extend({}, this.defaults, options));
        },
        _autoInstantiateBindings: function() {
            var self = this, root = self.get('$el')[0],
                widgets = asSettable.flattened(self.get('widgets') || {}),
                name = self.get('name');
            t.dfs(root, function(el, parentEl, ctrl) {
                var $widget, params, widget = _.find(widgets, function(w) {
                        return (w.node || w.el) === el? w : null;
                    }),
                    group = el.getAttribute('data-bind-group') || 'main';

                // handle widget and views
                $widget = widget && (widget.$node || widget.$el);
                if (group === name && widget && $widget.attr('data-bind')) {
                    params = {
                        prop: $widget.attr('data-bind'),
                        twoWay: true,
                        widget: widget
                    };
                } else if (group === name && el.getAttribute('data-bind')) {
                    params = {prop: el.getAttribute('data-bind'), $el: $(el)};
                }

                if (params) {
                    ctrl.cutoff = true;
                    params.strings = [];
                    if (self.has('strings.field_errors.' + params.prop)) {
                        params.strings.push(
                            self.get('strings.field_errors.' + params.prop));
                    }
                    if (self.has('strings.errors')) {
                        params.strings.push(self.get('strings.errors'));
                    }
                    if (self.has('globalErrorStrings')) {
                        params.strings.push(self.get('globalErrorStrings'));
                    }
                    self.addBinding(Binding(params));
                }
            });
        },
        addBinding: function(binding) {
            if (this.get('model')) {
                binding.set('model', this.get('model'));
            }
            this.bindings.push(binding);
        },
        processErrors: function(errors) {
            _.each(this.bindings, function(binding) {
                binding.processErrors(errors);
            });
            return this;
        },
        update: function(changed) {
            var model;
            if (changed.$el) {
                this._autoInstantiateBindings();
            }
            if (changed.model) {
                model = this.get('model');
                _.each(this.bindings, function(binding) {
                    binding.set({model: model});
                });
            }
        }
    });

    asSettable.call(BindingGroup.prototype, {onChange: 'update'});

    return BindingGroup;
});
