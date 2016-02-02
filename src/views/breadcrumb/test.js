/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    './../breadcrumb'
], function(BreadCrumb) {

    test ('instantiation', function(){
        var bc = BreadCrumb();
        ok(bc);
    });

    test ('one crumb ahaha', function(){
        var bc = BreadCrumb({
            crumbs: [
                {value: 'foo', content: 'Foo'}
            ]
        }).appendTo('body');
        equal(bc.get('crumbs').length, 1, 'one crumb');
    });

    test ('two crumbs ahaha', function(){
        var bc = BreadCrumb({
            crumbs: [
                {value: 'foo', content: 'Foo'},
                {value: 'bar', content: 'Bar'}
            ]
        });
        equal(bc.get('crumbs').length, 2, 'two crumbs');
    });

    test ('three crumbs ahaha', function(){
        var bc = BreadCrumb({
            crumbs: [
                {value: 'foo', content: 'Foo'},
                {value: 'bar', content: 'Bar'},
                {value: 'tao', content: 'Tao'}
            ]
        });
        equal(bc.get('crumbs').length, 3, 'three crumbs');
    });

    asyncTest ('breadcrumb click handler override', function(){
        var clicks = 0,
            BC = BreadCrumb.extend({
                defaults: {
                    crumbs: [
                        {value: 'foo', content: 'Foo'},
                        {value: 'bar', content: 'Bar'},
                        {value: 'tao', content: 'Tao'}
                    ]
                },
                onBreadCrumbClick: function(evt) {
                    clicks++;
                }
            });
            bc = BC();//.appendTo('body');

        equal(clicks, 0, 'no clicks');
        bc.$el.find('[value=foo]').click();
        setTimeout(function() {
            equal(clicks, 1, 'bar clicked');
            bc.$el.find('[value=bar]').click();
            setTimeout(function() {
                equal(clicks, 2, 'foo clicked');
                bc.$el.find('[value=tao]').click();
                setTimeout(function() {
                    equal(clicks, 2, 'tao is the last breadcrumb and cannot be clicked');
                    start();
                }, 10);
            }, 10);
        }, 10);
    });

    asyncTest ('breadcrumb click handler override returns crumb object', function(){
        var BC = BreadCrumb.extend({
                defaults: {
                    crumbs: [
                        {value: 'foo', content: 'Foo'},
                        {value: 'bar', content: 'Bar'},
                        {value: 'tao', content: 'Tao'}
                    ]
                },
                onBreadCrumbClick: function(evt, crumb) {
                    var $target = $(evt.currentTarget),
                        value = $target.attr('value');
                    equal(value, crumb.value, 'target value and crumb value match');
                }
            });
            bc = BC().appendTo('body');

        bc.$el.find('[value=foo]').click();
        setTimeout(function() {
            bc.$el.find('[value=bar]').click();
            setTimeout(function() {
                start();
            }, 10);
        }, 10);
    });
    start();
});
