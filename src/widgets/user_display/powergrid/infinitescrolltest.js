/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, 
  raises, getTopBottom*/



getTopBottom = function($,el){
	getTopBottom = function(dontPrint){
		var rows = el.find('tr'),
			rowLen = rows.length,first,last;
		first = el.find('tr:first-child').find('td:first-child').attr('title');
		last = el.find('tr:nth-child('+(rowLen-1)+')').find('td:first-child').attr('title');
		if(!dontPrint) {
		    console.log('First:',first,'\tLast:',last,'\tTotal:',rowLen-1);
		}
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

      
    asyncTest('scroll to either end of records works', function() {
        setup({
            // appendTo: 'body',
            params: {limit: 200},
            gridOptions: {
                infiniteScroll: true,
                increment: 100,
                keyboardNavigation:false,
                bufferSize:150
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
                scrollToBeginning,
                inter,
                count = 0,
                testyDown = $('<button>Scroll To Bottom</button>'),
                testyUp = $('<button>Scroll To Top</button>'),
                scrollToBottom = function(e){
		        	$rowWrapper.scrollTop($rows.height());
		        	//setTimeout(getTopBottom,500);
		        },
		        scrollToTop = function(e){
		        	$rowWrapper.scrollTop(0);
		        	//setTimeout(getTopBottom,500);
		        };
			
			$('body').append(testyDown).append(testyUp); 
            testyDown.on('click',scrollToBottom);
			testyUp.on('click',scrollToTop);
			
			getTopBottom($,$rowWrapper);
			
			scrollToBeginning = function(){
			    if(getTopBottom(true).first === "item 0"){
			        clearTimeout(inter);
			        scrollToTop();
			        ok(true,"Reached beginning of list");
			        start();
			        return;
			    }
			    scrollToTop();
			    inter = setTimeout(scrollToBeginning,700);
			}
			scrollToEnd = function(){
				if(g._isAllDataLoaded()){
					clearTimeout(inter);
					scrollToBottom();
					ok(true,"Reached end of list");
					inter = setTimeout(scrollToBeginning,600);
					return;
				}
				$rowWrapper.scrollTop($rows.height());
				inter = setTimeout(scrollToEnd,700);
			}
            scrollToEnd();
        });
    });
    start();
});
