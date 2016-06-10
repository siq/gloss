/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    './../verticalnav',
    'tmpl!./test.mtpl',
], function(VerticalNav, testTmpl) {

    var VerticalNavTest = VerticalNav.extend({
        template: testTmpl,
    });
    test ('declarative template', function(){
        var bc = VerticalNavTest({
                template: testTmpl,
            })
            .appendTo('#qunit-fixture');
            // .appendTo('body');
        ok(bc);
        $('[id^=qunit-]').hide();
        $('body').css('margin', 0);
    });

    test ('defaults configuration', function(){
        var bc = VerticalNav({
                items: [
                    {
                        content: 'Dashboard',
                        value: '/',
                        icon: './img/catalog.svg',
                    },
                    {
                        content: 'Details',
                        value: '/details',
                        icon: './img/catalog.svg',
                        children: [
                            {
                                content: 'Ancestry',
                                value: '/details/ancestry',
                                icon: './img/catalog.svg',
                            },
                            {
                                content: 'Action Log',
                                value: '/details/action-log',
                                icon: './img/catalog.svg',
                            },
                            {
                                content: 'Data Objects',
                                value: '/details/sample-objects',
                                icon: './img/catalog.svg',
                            },
                        ],
                    },
                    {
                        content: 'Refine',
                        value: '/explore',
                        icon: './img/catalog.svg',
                    },
                    {
                        content: 'Create',
                        value: '/filter',
                        icon: './img/catalog.svg',
                        children: [
                            {
                                content: 'Library',
                                value: '/filter/saved-filter',
                                icon: './img/catalog.svg',
                            },
                            {
                                content: 'Build',
                                value: '/filter/build-filter',
                                icon: './img/catalog.svg',
                            },
                            {
                                content: 'Set Ops',
                                value: '/filter/set-ops',
                                icon: './img/catalog.svg',
                            },
                            {
                                content: 'Node Ops',
                                value: '/filter/scope-ops',
                                icon: './img/catalog.svg',
                            },
                            {
                                content: 'Duplicate',
                                value: '/filter/duplicate-ops',
                                icon: './img/catalog.svg',
                            },
                        ],
                    },
                    {
                        content: 'Enhance',
                        value: '/enhance',
                        icon: './img/catalog.svg',
                    },
                    {
                        content: 'Action',
                        value: '/action',
                        icon: './img/catalog.svg',
                    },
                    {
                        content: 'Report',
                        value: '/report',
                        icon: './img/catalog.svg',
                        children: [
                            {
                                content: 'System',
                                value: '/report/system-reports',
                                icon: './img/catalog.svg',
                            },
                            {
                                content: 'User',
                                value: '/report/user-reports',
                                icon: './img/catalog.svg',
                            },
                        ],
                    },
                    {
                        content: 'Exceptions',
                        value: '/exceptions',
                        icon: './img/catalog.svg',
                    },
                ],
            })
            // .appendTo('#qunit-fixture');
            .appendTo('body');
        ok(bc);
        $('[id^=qunit-]').hide();
        $('body').css('margin', 0);
    });

    start();
});
