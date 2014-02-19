/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, 
  raises, getTopBottom*/


// Utility function to get the current value of first and last item, total items in the list
var getTopBottom = function($,el){
    /*lazy function definition*/
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
	return getTopBottom();
	
};
define([
    'vendor/jquery',
    'vendor/underscore',
    './../powergrid',
    './column',
    './column/checkboxcolumn',
    './column/asdatetime',
    './column/asbytes',
    './column/asnumber',
    './asformwidget',
    'mesh/tests/mockedexample',
    'mesh/tests/examplefixtures',
    './utils'
], function($, _, PowerGrid, Column,
    CheckBoxColumn, asDateTime, asBytes, asNumber, asFormWidget, Example,
    exampleFixtures, utils) {

	var totalCount = 1000;
    var setup = utils.setup,
        trim = utils.trim,
        $dfd = $.Deferred(),
        scrollToBottom,
        scrollToTop,
        scrollToEnd,
        scrollToBeginning,
        testyDown = $('<button>Scroll To Bottom</button>'),
        testyUp = $('<button>Scroll To Top</button>');

	module('infinite scroll');
      
    $dfd.then(function(){console.log('then')});
    asyncTest('scroll to end of records works', function() {
        setup({
            params: {limit: 100},
            gridOptions: {
                infiniteScroll: true,
                increment: 400,
                keyboardNavigation:false,
                bufferSize:500
            },
            delay:300,
            appendTo: 'body'
        }).then(function(g, options) {
            var collection = g.get('collection'),
            	incr = g.get('increment'),
            	oldLimit = collection.query.params.limit,
            	$rowWrapper = g.$el.find('.row-inner-wrapper'),
                $rows = g.$el.find('.rows'),
                buffer = g.get('bufferSize'),
                inter;
            
            // set height and widths for visual resize testing
            g.$el.height(400);
            g.$el.width(800);
            // rerender so the height and width changes are pickued up
            g.rerender();
			    
            scrollToBottom = function(e){
		        $rowWrapper.scrollTop($rows.height());
		      	//setTimeout(getTopBottom,500);
		    };
		    scrollToTop = function(e){
		        $rowWrapper.scrollTop(0);
		       	//setTimeout(getTopBottom,500);
		    };
			
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
		    };
		    
		    scrollToEnd = function(){
				if(g._isAllDataLoaded()){
					clearTimeout(inter);
					scrollToBottom();
					ok(true,"Reached end of list");
					ok(true,"scroll to end completed, kicking off scroll to beginning now");
					start();
					$dfd.resolve();
					return;
				}
				$rowWrapper.scrollTop($rows.height());
				inter = setTimeout(scrollToEnd,700);
			};
			
			// Utility buttons for one click scroll up/down	, uncomment for visual testing		
			
			/*$('body').append(testyDown).append(testyUp); 
            testyDown.on('click',scrollToBottom);
			testyUp.on('click',scrollToTop);*/
			
			// Get the initial value of first, last and total
			getTopBottom($,$rowWrapper);
			
			// Begin scroll to end of the list
            scrollToEnd();
        });
    });
    asyncTest('scroll to beginning of records works', function() {	
        $dfd.then(function(){
            // Begin scroll to top of the list
            setTimeout(scrollToBeginning,1200);
        });
    });
    start();
});
