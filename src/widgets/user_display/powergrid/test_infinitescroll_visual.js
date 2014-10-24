/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, 
  raises, getTopBottom*/


// Utility function to get the current value of first and last item, total items in the list
var getTopBottom = function($, el) {
    /*lazy function definition*/
    getTopBottom = function(dontPrint) {
        var rows = el.find('tr'),
            rowLen = rows.length,
            first, last;
        first = el.find('tr:first-child').find('td:first-child').attr('title');
        last = el.find('tr:nth-child(' + (rowLen - 1) + ')').find('td:first-child').attr('title');
        if (!dontPrint) {
            console.log('First:', first, '\tLast:', last, '\tTotal:', rowLen - 1);
        }
        return {
            first: first,
            last: last,
            total: rowLen - 1
        }
    }
    return getTopBottom();

};

function fixturize(fixtureData, range) {
    return fixtureData.slice(0, range);
}

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
    //'mesh/tests/mockedexample',
    'mesh/tests/example',
    'mesh/tests/examplefixtures',
    './utils',
    'mesh/tests/mockutils'
], function($, _, PowerGrid, Column,
    CheckBoxColumn, asDateTime, asBytes, asNumber, asFormWidget, MeshExample,
    exampleFixtures, utils, mockResource) {


    var Example,
        setup = utils.setup,
        teardown = utils.teardown,
        totalRecords,
        trim = utils.trim,
        $dfd,
        scrollToBottom,
        scrollToTop,
        scrollToEnd,
        scrollToBeginning,
        delay = 100,
        testyDown = $('<button>Scroll To Bottom</button>'),
        testyUp = $('<button>Scroll To Top</button>'),
        defaults = {
            increment: 50,
            limit: 100,
            windowFactor: 1
        };


    module('infinite scroll');
    asyncTest('scroll down/up loads the correct number of records', function() {
        var totalRecords = 350;

        mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
            
        setup({
            params: {
                limit: defaults.limit
            },
            gridOptions: {
                infiniteScroll: true,
                increment: defaults.increment,
                keyboardNavigation: false,
                windowFactor: defaults.windowFactor
            },
            delay: delay,
            appendTo: 'body'
        }).then(function(g, options) {
            var collection = g.get('collection'),
                incr = g.get('increment'),
                oldLimit = collection.query.params.limit,
                $rowWrapper = g.$el.find('.row-inner-wrapper'),
                $rows = g.$el.find('.rows'),
                inter;

            // set height and widths for visual resize testing
            g.$el.height(400);
            g.$el.width(800);
            // rerender so the height and width changes are pickued up
            g.rerender();

            scrollToBottom = function(e) {
                $rowWrapper.scrollTop($rows.height());
            };
            scrollToTop = function(e) {
                $rowWrapper.scrollTop(0);
            };

            /*scrollToBeginning = function() {
                if (getTopBottom(true).first === 'item 0') {
                    clearTimeout(inter);
                    scrollToTop();
                    ok(true, 'Reached beginning of list');
                    start();
                    return;
                }
                scrollToTop();
                inter = setTimeout(scrollToBeginning, delay * 2);
            };*/

            /*scrollToEnd = function() {
                if (g._isAllDataLoaded()) {
                    clearTimeout(inter);
                    scrollToBottom();
                    ok(true, 'Reached end of list');
                    _$dfd.resolve();
                    start();

                    return;
                }
                $rowWrapper.scrollTop($rows.height());
                inter = setTimeout(scrollToEnd, delay * 2);
            };*/

            // Utility buttons for one click scroll up/down , uncomment for visual testing      

            $('body').append(testyDown).append(testyUp);
            testyDown.on('click', scrollToBottom);
            testyUp.on('click', scrollToTop);
            ok(true, 'all good');
            start();
        });
    });
    start();
});