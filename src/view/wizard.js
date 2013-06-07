define([
    'vendor/jquery',
    'vendor/underscore',
    'gloss/core/registry',
    'gloss/widgets/simpleview',
    './form',
    'tmpl!./wizard/header.mtpl',
    'tmpl!./wizard/wizard.mtpl',
    'tmpl!./wizard/footer.mtpl',
    'css!./wizard/wizard.css'
], function($, _, Registry, SimpleView, Form, headerTemplate, wizardTemplate,
    footerTemplate) {

    var registry = Registry.getInstance(),

        Header = SimpleView.extend({
            template: headerTemplate,
            update: function(changed) {
                this._super.apply(this, arguments);
                if (changed.totalPanes || changed.currentPane) {
                    this.render();
                }
            }
        }),

    Wizard = Form.extend({
        template: wizardTemplate,
        defaults: {
            templates: {
                footer: footerTemplate
            },
            currentPane: 0,
            strings: {footer: {back: 'back', next: 'next'}},
            fieldsetSelector: 'fieldset:not(.footer),.fieldset:not(.footer)'
        },
        _initWidgets: function() {
            var ret = this._super.apply(this, arguments);
            this.$panes = this.getPanes();
            this.header = Header({
                strings: this.get('strings'),
                totalPanes: this.$panes.length,
                $el: this.$el.children('h2')
            });
            return ret;
        },
        _bindEvents: function() {
            var self = this, ret = self._super.apply(self, arguments);
            _.bindAll(this, '_onNextClick', '_onBackClick');
            this.on('click', '[name=next]', this._onNextClick)
                .on('click', '[name=back]', this._onBackClick);
            return ret;
        },
        _onBackClick: function(evt) {
            if (this.get('currentPane') > 0) {
                this.set('currentPane', this.get('currentPane')-1);
            }
        },
        _onNextClick: function(evt) {
            var self = this, visible;
            if (self.get('currentPane') < self.$panes.length-1) {
                 visible = _.map(self._visibleBindings(), function(binding) {
                    return binding.get('prop');
                });
                self.get('model').validate(visible).then(function() {
                    self.set('currentPane', self.get('currentPane')+1);
                }, self.processErrors);
            }
        },
        _paneFromBinding: function(binding) {
            var $el = binding.has('widget')?
                binding.get('widget.$node') || binding.get('widget.$el') :
                binding.get('$el'),
                $fieldset = $el.closest(this.get('fieldsetSelector')),
                pane;
            this.$panes.each(function(i, el) {
                if (el === $fieldset[0]) {
                    pane = i;
                }
            });
            return pane;
        },
        _processErrors: function(globalErrors, fieldErrors) {
            var errorProps, self = this, earliest = 0;
            if (fieldErrors) {
                earliest = self.$panes.length-1;
                errorProps = _.keys(fieldErrors.serialize({flatten: true}));
                _.each(self.bindingGroups, function(group) {
                    _.each(group.bindings, function(binding) {
                        var pane = self._paneFromBinding(binding);
                        earliest = pane < earliest? pane : earliest;
                    });
                });
            } 
            // if (!fieldErrors && !globalErrors) {
            //     this.set('currentPane', this.get('currentPane')+1);
            // } else {
                this.set('currentPane', earliest);
            // }
            return this._super.apply(this, arguments);
        },
        _showPane: function(pane) {
            if (pane === 0) {
                this.getWidget('back').disable();
            } else {
                this.getWidget('back').enable();
            }
            if (pane < 0) {
                return;
            }
            if (pane === this.$panes.length-1) {
                this.getWidget('next').hide();
                this.getWidget('submit').show();
            } else {
                this.getWidget('next').show();
                this.getWidget('submit').hide();
            }
            // show current pane
            this.$panes.addClass('hidden');
            this.$panes.eq(pane).removeClass('hidden');
            registry.propagate(this.$panes.eq(pane)[0], 'show');
            this._validateFields();
            this._focusOnFirstVisibleBinding();
        },
        // _visibleBindings is overridden to check for a the current <fieldset>
        _visibleBindings: function(name) {
            var $visible = this.$panes.eq(this.get('currentPane')),
                selector = this.get('fieldsetSelector'),
                bindings;
            name = name || 'main';
            bindings = this.bindingGroups ? this.bindingGroups[name].bindings : [];
            return _.filter(bindings, function(binding) {
                    var $el = binding.has('widget')?
                        binding.get('widget.$node') || binding.get('widget.$el') :
                        binding.get('$el');
                    return  $el.closest(selector)[0] === $visible[0];
                });
        },
        getPanes: function() {
            return this.$el.find(this.get('fieldsetSelector'));
        },
        show: function() {
            this.set('currentPane', 0, {update: true});
            return this._super.apply(this, arguments);
        },
        update: function(changed) {
            var method, self = this;
            self._super.apply(self, arguments);
            if (changed.currentPane) {
                self.waitForInitialRender.then(function() {
                    self.header.set('currentPane', self.get('currentPane'));
                    self._showPane(self.get('currentPane'));
                });
            }
            if (changed.visibleFieldsAreValid) {
                method = self.get('visibleFieldsAreValid')?
                    'enable' : 'disable';
                self.getWidget('next')[method]();
            }
        }
    });

    return Wizard;
});
