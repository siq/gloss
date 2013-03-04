/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    './../widget'
], function(Widget) {
    test('instantiating a widget', function() {
        var createRan = false,
            A = Widget.extend({
                defaults: {
                    foo: 'bar'
                },
                create: function() {
                    createRan = true;
                }
            }),
            a = A();

        ok(a, 'widget instantiated');
        equal(createRan, true, '"create" method executed');
    });

    test('setting options', function() {
        var A = Widget.extend({
                defaults: {
                    foo: 'default foo value for A'
                }
            }),
            a1 = A(), a2 = A(null, {foo: 'non-default foo value for A'}),
            B = A.extend({
                defaults: {
                    bar: 'default bar value for B'
                }
            }),
            b = B(),
            C = B.extend({
                defaults: {
                    bar: 'default bar value for C'
                }
            }),
            c = C();

        equal(a1.options.foo, 'default foo value for A');
        equal(a2.options.foo, 'non-default foo value for A');
        equal(b.options.foo, 'default foo value for A');
        equal(b.options.bar, 'default bar value for B');
        equal(c.options.foo, 'default foo value for A');
        equal(c.options.bar, 'default bar value for C');
    });

    test('options are deeply extended without reference issue', function() {
        var A, a1, a2, a3,
            aOpts = {
                className: 'widget-a1',
                opt: {
                    a1: 'widget-a1 deepOpt',
                    arr: ['an', 'array']
                }
            },
            a2Opts = {
                className: 'widget-a2',
                opt: {
                    a2: 'widget-a2 deepOpt',
                    arr: []
                }
            };
            
        A = Widget.extend({
            defaults: { opts: aOpts }
        });
        a1 = A();
        a2 = A(null, { opts: a2Opts });
        equal(a1.options.opts.opt.a1, a2.options.opts.opt.a1);
    });

    //  - instantiating multiple instances of the same widget with different defaults extends
    //  - the defaults properly
    test('creating multiple instances of a widget with new defaults', function() {
        var A, a1, a2, a3,
            aOpts = {
                className: 'widget-a1',
                length: 10,
                lines: 10,
                radius: 15,
                width: 5,
                arr: ['a', 'test', 'array']
            },
            a2Opts = {
                className: 'widget-a2',
                length: 3,
                lines: 13,
                radius: 3,
                width: 2,
                arr: []
            };
            
        A = Widget.extend({
            defaults: {
                name: 'default name value for A',
                opts: aOpts
            }
        });
        a1 = A();
        a2 = A(null, {
            name: 'non-default name value for A - a2',
            opts: a2Opts
        });
        a3 = A(null, {name: 'non-default name value for A - a3'});

        //  - make sure defaults didn't get overwritten
        ok(!_.isEqual(aOpts, a2Opts), 'aOpts and a2Opts are different');

        ok(_.isEqual(a1.options.opts, aOpts), 'a1 and aOpts are equal');
        ok(_.isEqual(a2.options.opts, a2Opts), 'a2 and a2Opts are equal');
        ok(!_.isEqual(a1.options.opts, a2.options.opts), 'a1 and a2 opts are different');
        ok(_.isEqual(a3.options.opts, aOpts), 'a3 and aOpts are equal');
        ok(_.isEqual(a3.options.opts, a1.options.opts), 'a3 and a1 opts are equal');
        ok(!_.isEqual(a3.options, a1.options), 'a3 and a1 options are different');
    });

    test('setting new value for option', function() {
        var A = Widget.extend({
                defaults: {
                    name: 'default name'
                }
            }),
            a = A();

        a.set('name', 'a new name');
        equal(a.options.name, 'a new name', 'setting the name property to a new value works');

        var arr = ['a', 'new', 'array', 'object'];
        a.set('arr', arr);
        ok(_.isEqual(a.options.arr, arr), 'setting a new array property works');

        a.set('arr', []);
        equal(a.options.arr.length, 0, 'setting the array property to and empty array works');
    });

    test('mixins', function() {
        var Mixable = {
                defaults: {
                    foo: 'bar'
                },
                mixalot: function() {
                    ok(true, 'mixin successfully added a method');
                },
                clobber: function() {
                    ok(true, 'mixin successfully clobbered a method');
                }
            },
            A = Widget.extend({
                defaults: {
                    bar: 'baz'
                },
                clobber: function() {
                    ok(false, 'this should have been clobbered');
                }
            }),
            B = A.extend({
                defaults: {
                    baz: 'boom'
                }
            }, {mixins: [Mixable]}),
            // C = A.extend({
            //     defaults: {
            //         foo: 'bang'
            //     }
            // }, {mixins: [Mixable]}),
            b = B(),
            // c = C();
            C, c;

        C = A.extend({
            defaults: {
                foo: 'bang'
            }
        }, {mixins: [Mixable]}),
        c = C();

        b.mixalot();
        b.clobber();
        equal(b.options.bar, 'baz', 'inherited defaults are preserved');
        equal(b.options.baz, 'boom', 'base defaults are preserved');
        equal(b.options.foo, 'bar', 'mixed-in options are preserved');
        equal(c.options.foo, 'bang', 'mixed-in options are overridden by base options');
    });

    //  - Note that propagate only works on direct children not nested children
    test('propagating hide works', function() {
        var a, b, c, d;
        a = Widget(['<div class=a>',
                        '<div class=b></div>',
                        '<div class=c>',
                            '<div class=d></div>',
                        '</div>',
                    '</div>'].join(','));
        b = Widget(a.$node.find('.b'));
        c = Widget(a.$node.find('.c'));
        d = Widget(a.$node.find('.d'));

        a.propagate('hide');
        equal(b.$node.hasClass('hidden'), true, 'widget `b` is hidden');
        equal(c.$node.hasClass('hidden'), true, 'widget `c` is hidden');
        equal(d.$node.hasClass('hidden'), false, "widget `d` is not hidden because it's nested");
    });

    start();
});
