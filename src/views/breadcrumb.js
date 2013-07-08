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
        _modelFromCrumb: function(crumb) {
            var idx = this.$el.children('.breadcrumb').index(crumb);
            return idx >= 0? this.get('crumbs')[idx] : null;
        },
        // this will default behavior for click event on breadcrumbs
        // you should override `onBreadCrumbClick` for additional logic
        _onBreadCrumbClick: function(evt) {
            var model;
            if (!evt.metaKey && !evt.ctrlKey) {
                evt.preventDefault();
                model = this._modelFromCrumb(evt.currentTarget);
                this.onBreadCrumbClick(evt, model);
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
