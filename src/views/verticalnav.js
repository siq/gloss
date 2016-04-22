define([
    'vendor/underscore',
    './simpleview',
    'tmpl!./verticalnav/verticalnav.mtpl',
    'css!./verticalnav/verticalnav.css'
], function(_, SimpleView, template) {

    return SimpleView.extend({
        defaults: {
            items: []  // list of the format: [
                        //  {content: '...', value: '...', url: '...'},
                        //  {content: '...', value: '...', url: '...'},
                        //  ...
                        // ]
        },
        template: template,
        _bindEvents: function() {
            _.bindAll(this, '_onMenuItemClick', '_onMenuItemHover', '_onMenuItemLeave');
            // this.on('click', '[role=menuitem]', this._onMenuItemClick);
            this.on('click', 'li', this._onMenuItemClick);
            this.on('hover', 'li', this._onMenuItemHover);
            this.on('mouseleave', this._onMenuItemEnter);
            return this._super.apply(this, arguments);
        },
        _initWidgets: function() {
            // this.$el.addClass('vertical-nav');
            return this._super.apply(this, arguments);
        },
        // _modelFromItem: function(crumb) {
        //     var idx = this.$el.children('.breadcrumb').index(crumb);
        //     return idx >= 0? this.get('crumbs')[idx] : null;
        // },
        // this will default behavior for click event on breadcrumbs
        // you should override `onBreadCrumbClick` for additional logic
        _onMenuItemClick: function(evt) {
            var model,
                $item = $(evt.currentTarget);
            if (!evt.metaKey && !evt.ctrlKey) {
                evt.preventDefault();
                // model = this._modelFromItem(evt.currentTarget);
                // this.onMenuItemClick(evt, model);
                this.$el.find('li')
                    .removeClass('active')
                    .attr('aria-selected', false);
                $item.addClass('active')
                    .attr('aria-selected', true);
            }
            return this;
        },
        _onMenuItemHover: function(evt) {
            var $item = $(evt.currentTarget),
                idx = this.$el.find('li:not(.active-bar-vertical)').index($item);
            this.$el
                .removeClass(function (index, css) {
                    return (css.match (/(^|\s)pos-\S+/g) || []).join(' ');
                }).addClass('pos-'+idx);
            this.$el.find('.active-bar-vertical').addClass('move');
            return this;
        },
        _onMenuItemLeave: function(evt) {
            var $item = this.$el.find('li.active'),
                idx = this.$el.find('li:not(.active-bar-vertical)').index($item);
            this.$el
                .removeClass(function (index, css) {
                    return (css.match (/(^|\s)pos-\S+/g) || []).join(' ');
                }).addClass('pos-'+idx);
            // this.$el.find('.active-bar-vertical').removeClass('move');
            return this;
        },
        onMenuItemClick: function(evt) {
            return this;
        },
        update: function(changed) {
            this._super.apply(this, arguments);
            if (changed.items) {
                this.render();
            }
            return this;
        }
    });
});
