define([
    'vendor/underscore',
    'gloss/widgets/simpleview',
    'tmpl!./breadcrumb/breadcrumb.mtpl'
], function(_, SimpleView, template) {

    return SimpleView.extend({
        defaults: {
            crumbs: []  // list of the format: [
                        //  {content: '...', value: '...', url: '...'},
                        //  {content: '...', value: '...', url: '...'},
                        //  ...
                        // ]
        },
        template: template,
        _bindEvents: function() {
            _.bindAll(this, '_onBreadCrumbClick');
            this.on('click', '.breadcrumb', this._onBreadCrumbClick);
            return this;
        },
        _initWidgets: function() {
            this.$el.addClass('breadcrumbs');
            return this._super.apply(this, arguments);
        },
        // this will default behavior for click event on breadcrumbs
        // you should override `onBreadCrumbClick` for additional logic
        _onBreadCrumbClick: function(evt) {
            if (!evt.metaKey && !evt.ctrlKey) {
                evt.preventDefault();
                this.onBreadCrumbClick(evt);
            }
        },
        onBreadCrumbClick: function(evt) {
            return this;
        },
        update: function(changed) {
            if (changed.crumbs) {
                this.render();
            }
        }
    });
});
