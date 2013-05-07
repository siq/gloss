/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../page',
    'tmpl!./noArgTest.mtpl',
    'tmpl!./argTest.mtpl'
], function ($, Page, NoArgTmpl, ArgTmpl) {

    test('Page instantiation test', function () {
        var page = Page();

        ok(page);

        start();
    });
    test('Page micro template with no args test', function () {
        var page = Page(undefined, {
            template: NoArgTmpl(null)
        });

        ok(page);

        start();
    });
    test('Page micro template with args test', function () {
        var page,
            args = [
                {text: 'One'},
                {text: 'Two'},
                {text: 'Three'},
                {text: 'four'},
                {text: 'five'},
                {text: 'Six'}
            ];

        page = Page(undefined, {
            template: ArgTmpl(args)
        });

        ok(page);

        start();
    });
    test('Page loaded event test', function() {
        var page = Page();

        ok(page);
        page.on('loaded', function() {
            ok("complete", document.readyState);
        });
    });
    test('Page load deferred test', function() {
        var page = Page();

        page.load.done(function() {
            ok(page);
            start();
        });
    });

    test('Page height based element creation', function() {
	var args = [{text: 'some text'}];
	var page = Page( undefined, {template: ArgTmpl(args) });
	ok( page );

	var bigDocumentHeight = 1200;
	page.load.done('loaded', function() {
	    $('body').css( 'height', bigDocumentHeight );
	    var display = $('div.more-document-hinting').css('display');

	    equal( display, 'block', 'Body height set to 1200, hinting should be visible');

	    stop(); // Wait for the fadeOut to complete before checking disappearance.
	    $(document).ready(function() {
		$(window).scrollTop(bigDocumentHeight); 
		setTimeout( function() {
		    display = $('div.more-document-hinting').css('display');
		    equal( display, 'none', 
			   'Programmatically scrolled to the bottom, hint should disappear');
		    start();
		},1000);
	    });
	});
    });
    start();
});
