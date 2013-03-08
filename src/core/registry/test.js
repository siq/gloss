/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../registry',
    './../../widgets/widget',
    './../../view'
], function($, Registry, Widget, View) {

    var registry = Registry.getInstance();

    //  - Note that propagate only works on direct children not nested children
    //  - propagation should walk the DOM from the provided el and call `propagate`
    //  on any direct Widget/View
    test('propagate from an el works', function() {
        var aWidget, aView, nestedWidget, nestedView,
            propWidgetCount = 0, propViewCount = 0,
            PropWidget = Widget.extend({
                hide: function(method) {
                    this._super.apply(this, arguments);
                    propWidgetCount++;
                }
            }),
            PropView = View.extend({
                hide: function(method) {
                    this._super.apply(this, arguments);
                    propViewCount++;
                }
            }),
            template = ['<div class=aEl>',
                            '<div class=aWidget>',
                                '<div class=nestedWidget></div>',
                            '</div>',
                            '<div class=aView>',
                                '<div class=nestedView></div>',
                            '</div>',
                        '</div>'].join(','),
            $template = $(template);

        aWidget = PropWidget($template.find('.aWidget'));
        nestedWidget = PropWidget($template.find('.nestedWidget'));
        aView = PropView({$el: $template.find('.aView')});
        nestedView = PropView({$el: $template.find('.nestedView')});

        registry.propagate($template[0], 'hide');
        
        equal(propWidgetCount, 1, 'propagate was only called once on widget');
        equal(aWidget.$node.hasClass('hidden'), true, 'widget `aWidget` is hidden');
        equal(nestedWidget.$node.hasClass('hidden'), false, "widget `nestedWidget` is not hidden because it's nested");
        
        equal(propViewCount, 1, 'propagate was only called once one view');
        equal(aView.$el.hasClass('hidden'), true, "view `aView` is hidden");
        equal(nestedView.$el.hasClass('hidden'), false, "view `nestedView` is not hidden because it's nested");
        
    });

    start();
});
