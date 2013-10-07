/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../disabledtooltip',
    'text!./disabledtooltip.html'
], function($, _, DisabledTooltip, html) {
    
    var $dt = $(html);
    $dt.appendTo('body');

    test ('disabled button initialization with tooltip', function() {
    	var $button = $dt.find('button[value="isdisabled"]'),
    	    $div = $dt.find('div[name="isdisabled"]'),
    	    tooltip = DisabledTooltip($div, {
    		    'wrapTarget': $button,
    	    });

    	ok(tooltip);

    	start();
    });


    test ('enabled button initialization no tooltip', function() {
    	var $button = $dt.find('button[value="isenabled"]'),
    	    $div = $dt.find('div[name="isenabled"]'),
    	    tooltip = DisabledTooltip($div, {
    	    	'wrapTarget': $button,
    	    });

    	ok(tooltip);    

    	start();
    });

    test ('tooltip appears on disabled button', function() {
    	//triggering mouseenter event causes tooltip to appear
    	$('button[value="isdisabled"]').next().trigger('mouseenter');
    	//make sure tooltip is visible
    	var $tooltip = $('div[name="isdisabled"]:visible');

    	//check to make sure tooltip was found
    	ok($tooltip);

    	start();
    });

    test ('toottip does not appear on enabled button', function() {
    	//triggering mouseenter does not cause tooltip to appear
    	$('button[value="isenabled"]').next().trigger('mouseenter');
    	//make sure tooltip is not visible
    	var $tooltip = $('div[name="isenabled"]:disabled');

    	//check to make sure tooltip was found
    	ok($tooltip);

    	start();
    });

    test ('tooltip is disabled on disabled button on mouseleave event', function() {
    	//triggering mouseleave causes tooltip to disappear
    	$('button[value="isdisabled"]').next().trigger('mouseleave');
    	//make sure tooltip is not visible
    	var $tooltip = $('div[name="isdisabled"]:disabled');

    	//check to make sure tooltip was found
    	ok($tooltip);

    	start();
    });

    test ('tooltip remains disabled on enabled button on mouseleave event', function() {
    	//triggering mouseleave causes tooltip to disappear
    	$('button[value="isenabled"]').next().trigger('mouseleave');
    	//make sure tooltip is not visible
    	var $tooltip = $('div[name="isenabled"]:disabled');

    	//check to make sure tooltip was found
    	ok($tooltip);

    	start();
    });

    test ('wrapped disabled button receives click event', function() {
    	var $button = $dt.find('button[value="isdisabled"]'),
    	    buttonWasClicked = false;

    	$button.on('click', function() {
    		buttonWasClicked = true;
    	});

    	$button.next().trigger('click');

    	equal(buttonWasClicked, true, "disabled button was clicked");

    	start();
    });

    test ('wrapped enabled button receives click event', function() {
    	var $button = $dt.find('button[value="isenabled"]'),
    	    buttonWasClicked = false;

    	$button.on('click', function() {
    		buttonWasClicked = true;
    	});

    	$button.next().trigger('click');

    	equal(buttonWasClicked, true, "enabled button was clicked");

    	start();
    });

    start();
});
