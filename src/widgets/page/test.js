/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../page',
    'tmpl!./noArgTest.mtpl',
    'tmpl!./argTest.mtpl'
], function ($, Page, NoArgTmpl, ArgTmpl) {
    QUnit.config.autostart = false;

    module( "page", {
        setup: function() {

        }, teardown: function() {
            $('div.more-document-hinting').remove();
        }
    });

    asyncTest('Page instantiation test', function () {
        var page = Page(undefined, {disableHintingEvents: true});
        ok(page);
        start();
    });
    asyncTest('Page micro template with no args test', function () {
        var page = Page(undefined, {
            template: NoArgTmpl(null),
            disableHintingEvents: true
        });
        ok(page);
        start();
    });
    asyncTest('Page micro template with args test', function () {
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
            template: ArgTmpl(args),
            disableHintingEvents: true
        });
        ok(page);
        start();
    });
    asyncTest('Page loaded event test', function() {
        var page = Page(undefined, {disableHintingEvents: true}); 

        ok(page);
        page.on('loaded', function() {
            ok("complete", document.readyState);
        });
        start();
    });
    asyncTest('Page load deferred test', function() {
        var page = Page(undefined, {disableHintingEvents: true});
        page.load.done(function() {
            ok(page);
        });
        start();
    });

    /***** ADD OPTIONS EVENT BASED ENABLEMENT OF FADE QUEUE ******/
    /* Testing utils */
    var ensureHintThreshold = 3000;
    var showHintTemplate = "<div style='display:block; position:absolute; top:0; height:" + ensureHintThreshold + "'/></div>"; // This is not working
    var fadeSelector = 'div.more-document-hinting';

    var fadeDelayTest = function(tests) {
        /*Tests will take the form {behavior: b, eventSimulation: e, method: m)}*/
        var hintPage = Page(undefined, {template: showHintTemplate, 
                                        disableHintingEvents: true});
        hintPage.load.done( function() {
            _.each(tests, function(test, index) {
                var testHintHeight = 60;
                // Trigger event handler as if user viewport is far from bottom
                hintPage[test.behavior](test.eventSimulation, 
                                        testHintHeight,
                                        hintPage.options.displayHintThreshold+30);
                setTimeout(function() {
                    test.method(hintPage);
                    start();
                }, (hintPage.options.fadeRate - hintPage.options.fadeRate/2));
            });
        });
    };
    var genTest = function(behavior, eventSimulation, method) {
        return {behavior: behavior, eventSimulation: eventSimulation, method: method};
    };
    asyncTest('fade initially shown', function() {
        expect(1);
        var testOne = genTest('_initFooterShadow', undefined, function(hintPage) {
            equal(hintPage.fadeQueue.getCurrentDirection(), 'in',
                  'page initialized with height greater than hint threshold');
        });
        fadeDelayTest([testOne]);
    });

    /* shadow hinting tests */
    asyncTest('_mouseLeaveBehavior', function() {
        var testOne = genTest('_mouseLeaveBehavior', undefined, function(hintPage) {
            equal(hintPage.fadeQueue.getCurrentDirection(), 'in',
                  "on mouse leave the fader should be present");
        });
        fadeDelayTest([testOne]);
    });
    asyncTest('_mouseEnterBehavior', function() {
        var e = {pageY: $(window).scrollTop()+$(window).height()-5};
        var testOne = genTest('_mouseEnterBehavior', e, function(hintPage) {
            equal(hintPage.fadeQueue.getCurrentDirection(), 'out',
                  "on mouse enter the fader should not be present on hover");
        });
        fadeDelayTest([testOne]);
    });

    asyncTest('_mouseMoveBehavior', function() {
        var e = {pageY: $(window).scrollTop()+$(window).height()-5};
        var testOne = genTest('_mouseMoveBehavior', e, function(hintPage) {
            equal(hintPage.fadeQueue.getCurrentDirection(), 'out',
                  'mouse move triggers minimum opacity only if mouse is over the fade');
        });
        fadeDelayTest([testOne]);
    });
    asyncTest('_clickBehavior', function() {
        var eOnHint = {pageY: $(window).scrollTop()+$(window).height()-5};
        var testOne = genTest('_clickBehavior', eOnHint, function(hintPage) {
            equal(hintPage.fadeQueue.getCurrentDirection(), 'out',
                  'mouse move triggers minimum opacity if mouse is on the fade');
        });
        var eOffHint = {pageY: 0};
        var testTwo = genTest('_clickBehavior', eOffHint, function(hintPage) {
            equal(hintPage.fadeQueue.getCurrentDirection(), 'in',
                  'mouse click triggers maximum opacity if mouse is off the fade');
        });
        fadeDelayTest([testOne]);
    });
    asyncTest('_pollViewPos', function() {
        var e = {pageY: $(window).scrollTop()+$(window).height()-5};
        var testOne = genTest('_pollViewPos', e, function(hintPage) {
            equal(hintPage.fadeQueue.getCurrentDirection(), 'in',
                  '_pollViewPos triggers does nothing if mouse is not over fade');
        });
        fadeDelayTest([testOne]);
    });
    asyncTest('_initFooterShadow', function() {
        var e = {pageY: $(window).scrollTop()+$(window).height()-5};
        var testOne = genTest('_initFooterShadow', e, function(hintPage) {
            equal(hintPage.fadeQueue.getCurrentDirection(), 'in',
                  'init footer shadow should defaut to "in"');
        });
        fadeDelayTest([testOne]);
    });
    start();
});
