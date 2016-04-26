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
            this._super.apply(this, arguments);
            _.bindAll(this, '_onMenuItemClick');
            // this.on('click', '[role=menuitem]', this._onMenuItemClick);
            this.on('click', 'li', this._onMenuItemClick);
            return this;
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
        // you should override `onMenuItemClick` for additional logic
        _onMenuItemClick: function(evt) {
            var model,
                $item = $(evt.currentTarget),
                isItemNested = function($item) {
                    var $active = this.$el.find('li.active:first');
                    return $active.has($item).length > 0;
                };
            if ($item.is('.active')) {
                return;
            }
            if (!evt.metaKey && !evt.ctrlKey) {
                // evt.preventDefault();
                evt.stopPropagation();
                // model = this._modelFromItem(evt.currentTarget);
                // this.onMenuItemClick(evt, model);

                // if the item is nested then only remove the active class from
                // other nested items
                if (isItemNested.call(this, $item)) {
                    this.$el.find('li.active')
                        .find('li')
                        .removeClass('active')
                        .attr('aria-selected', false);
                } else {
                    this.$el.find('li')
                        .removeClass('active')
                        .attr('aria-selected', false);
                }
                $item.addClass('active')
                    .attr('aria-selected', true);

                // if the header is selected set the first child as active
                if ($item.is('.level-2-header')) {
                    $item.find('li:first')
                        .addClass('active')
                        .attr('aria-selected', true);
                }
            }
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
