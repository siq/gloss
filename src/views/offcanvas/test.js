/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../offcanvas',
    './../form',
    './../simpleview',
    'mesh/tests/nestedpolymorphicexample',
    'tmpl!./../form/test.mtpl',
    'css!./test.css'
], function($, OffCanvas, Form, SimpleView, Resource, formTmpl) {

    var number = 0;
    function setup(opts) {
        var options = opts.options || {
                title: "I'm a basic title for this thing"
            },
            view = OffCanvas(options),
            appendTo = opts.appendTo,
            button;

        view.appendTo(appendTo || '#qunit-fixture');
        button = $('<button class='+number+'>show offcanvas '+ number +'</button>');
        button.appendTo('body');
        button.on('click', function() {
            view.show();
        });
        number++;
        return view;
    }

    test('initialization', function() {
        var view = setup({
                // appendTo: '#qunit-fixture'
                appendTo: 'body'
            });

        $('<p style="width: 500px;">Im content!</p>').appendTo(view.$el);
        // view.$el.removeClass('hidden');
        ok(view);
    });

    module('forms');

    var MyForm = Form.extend({
        defaults: {
            templates: {fieldsets: formTmpl},
            globalErrorStrings:  {
                invalid: "There was an error",
                nonnull: "Cannot be blank.",
                blanktexterror: "Cannot be blank."}
        }
    });

    test('with a form', function() {
        var view = setup({
                // appendTo: '#qunit-fixture'
                appendTo: 'body'
            }),
            form = MyForm().appendTo(view);

        // bindEvents(view);
        // view.$el.removeClass('hidden');
        ok(view);
    });

    test('with a form with a mock model', function() {
        var view = setup({
                // appendTo: '#qunit-fixture'
                appendTo: 'body'
            }),
            form = MyForm().appendTo(view),
            m = Resource();

        form.$el.width(500);
        form.set('model', m);
        form.show();
        // view.$el.removeClass('hidden');
        ok(view);
    });

    module('in a view');
    var View = SimpleView.extend({
        template: '<div class=parent-view>Parent View</div>'
    });

    test('in a view', function() {
        var view = setup({
                // appendTo: '#qunit-fixture'
                appendTo: 'body'
            }),
            parentView = View().appendTo('body');

        $('<p style="width: 500px;">Im content!</p>').appendTo(view.$el);
        view.appendTo(parentView.$el);
        // parent needs some style to contain the offcanvas view
        parentView.$el.css({
            // it MUST be postion relative
            position: 'relative',
            width: '800px',
            height: '600px',
            'background-color': '#aaa'
        });

        ok(view);
    });

    test('in a conatiner view', function() {
        var view = setup({
                // appendTo: '#qunit-fixture'
                appendTo: 'body'
            }),
            containerView = SimpleView.extend({template: '<div class=container>Container View</div>'})().appendTo('body'),
            parentView = View().appendTo(containerView.$el);

        $('<p style="width: 400px;">Im content!</p>').appendTo(view.$el);
        view.appendTo(containerView.$el);
        // parent needs some style to contain the offcanvas view
        containerView.$el.css({
            // it MUST be postion relative
            position: 'relative',
            width: '800px',
            height: '600px',
            'background-color': '#aea'
        });
        parentView.$el.css({
            width: '100%',
            height: '100%',
            'background-color': '#aaa'
        });
        $('button.4').on('click', function() {
            parentView.$el.addClass('drop');
        });
        view.on('hide', function() {
            parentView.$el.removeClass('drop');
        });

        ok(view);
    });

    start();
});
