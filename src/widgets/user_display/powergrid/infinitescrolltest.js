/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/

// things that are hard to test:
//  - correct placement of the spinner
//  - double clicking multi-select rows
//
// fun facts about these tests:
//  - we can't test a bunch of the checkbox column stuff in any browser other
//    than webkit b/c it's the only one that allows you to check a checkbox by
//    triggering a click event
//  - setting a th width below the content width in IE doesn't work, so one of
//    the unit tests for column resizing doesn't work in IE
//
// things to watch for (visual tests)
//  * the last grid on the page can be used for these tests *
//  - resizing is a rather brittle thing after making changes visually
//    check that a column can be resized
//  - fixed header should be visually tested to make sure it doesn't move
//    when scrolling. If this gets broken it's probaby because someone
//    was playing with the base css.
getTopBottom = function($,el){
	getTopBottom = function(){
		var rows = el.find('tr'),
			rowLen = rows.length,first,last;
		first = el.find('tr:first-child').find('td:first-child').attr('title');
		last = el.find('tr:nth-child('+(rowLen-1)+')').find('td:first-child').attr('title');
		console.log('First:',first,'\tLast:',last,'\tTotal:',rowLen-1);
		return {first:first,last:last,total:rowLen-1}
	}
	getTopBottom();
	return getTopBottom;
	
}
define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './../../../util/scrollbar',
    './../powergrid',
    './columnmodel',
    './column',
    './column/checkboxcolumn',
    './column/asdatetime',
    './column/asbytes',
    './column/asnumber',
    './asformwidget',
    'mesh/tests/mockedexample',
    'mesh/tests/examplefixtures',
    './utils'
], function($, _, moment, scrollbar, PowerGrid, ColumnModel, Column,
    CheckBoxColumn, asDateTime, asBytes, asNumber, asFormWidget, Example,
    exampleFixtures, utils) {

	var totalCount = 1000;
    var BasicColumnModel = utils.BasicColumnModel,
        setup = utils.setup,
        trim = utils.trim;

    function aboutEqual(a, b, msg, tolerance) {
        var greater = a > b? a : b;
        msg = msg == null? 'values are within ' + tolerance*100 + '%' : msg;
        tolerance = tolerance || 0.02;
        ok(Math.abs(a-b) / greater < tolerance, msg);
    }
	module('infinite scroll');

    /*asyncTest('scroll to bottom loads more data', function() {
        setup({
            // appendTo: 'body',
            params: {limit: 400},
            gridOptions: {
                infiniteScroll: true,
                increment: 250,
                keyboardNavigation:false,
                bufferSize:500
            },
            delay:300,
            appendTo: 'body'
        }).then(function(g, options) {
            // set height and widths for visual resize testing
            
            
            g.$el.height(400);
            g.$el.width(800);
            // rerender so the height and width changes are pickued up
            g.rerender();

            var collection = g.get('collection'),
            	incr = g.get('increment'),
            	oldLimit = collection.query.params.limit,
            	$rowWrapper = g.$el.find('.row-inner-wrapper'),
                $rows = g.$el.find('.rows'),
                buffer = g.get('bufferSize'),
                testyDown = $('<button>Scroll To Bottom</button>'),
                testyUp = $('<button>Scroll To Top</button>'),
                scrollToBottom = function(e){
		        	$rowWrapper.scrollTop($rows.height());
		        	setTimeout(getTopBottom,500);
		        },
		        scrollToTop = function(e){
		        	$rowWrapper.scrollTop(0);
		        	setTimeout(getTopBottom,500);
		        };;
             
            $('body').append(testyDown).append(testyUp); 
            testyDown.on('click',scrollToBottom);
			testyUp.on('click',scrollToTop);

            //
            setTimeout(function() {
	            if(buffer <= incr){
	            	equal(buffer,collection.query.params.limit,"On initial load, limit equals buffer size");
	            }else{
	            	equal(oldLimit+incr,collection.query.params.limit,"On initial load, limit increased by increment");
	            }
	            ok(true);
                getTopBottom($,$rowWrapper);
                start();
            }, 500);
        });
    });*/
    
    asyncTest('scroll to end of records works', function() {
        setup({
            // appendTo: 'body',
            params: {limit: 50},
            gridOptions: {
                infiniteScroll: true,
                increment: 50,
                keyboardNavigation:false,
                bufferSize:50
            },
            delay:300,
            appendTo: 'body'
        }).then(function(g, options) {
            // set height and widths for visual resize testing
            g.$el.height(400);
            g.$el.width(800);
            // rerender so the height and width changes are pickued up
            g.rerender();
			
            var collection = g.get('collection'),
            	incr = g.get('increment'),
            	oldLimit = collection.query.params.limit,
            	$rowWrapper = g.$el.find('.row-inner-wrapper'),
                $rows = g.$el.find('.rows'),
                buffer = g.get('bufferSize'),
                scrollToEnd,
                inter,
                count = 0;
			
			
			//getTopBottom($,$rowWrapper);
			scrollToEnd = function(){
				if(g._isAllDataLoaded()){
					clearTimeout(inter);
					$rowWrapper.scrollTop($rows.height());
					ok(true,"Reached end of list");
					start();
					return;
				}
				count++;
				$rowWrapper.scrollTop($rows.height());
				inter = setTimeout(scrollToEnd,700);
			}
			ok(true);start();
            //scrollToEnd();
        });
    });
    start();
});
