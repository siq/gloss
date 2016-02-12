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
        BasicColumnModel = utils.BasicColumnModel,
        delay = 100,
        testyDown = $('<button>Scroll To Bottom</button>'),
        testyUp = $('<button>Scroll To Top</button>'),
        defaults = {
            collectionLimit: 100,
        },
        /* the core test function, accepts options to configure window size*/
        runTest = function(opts) {
            var _$dfd = $.Deferred();
            opts = $.extend(defaults, opts);
            teardown();
            setup({
                params: {
                    limit: opts.collectionLimit
                },
                gridOptions: {
                    infiniteScroll: true,
                    keyboardNavigation: false,
                },
                delay: delay,
                appendTo: 'body',
                range: opts.range,
            }).then(function(g, options) {
                var collection = g.get('collection'),
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
                    //setTimeout(getTopBottom,500);
                };
                scrollToTop = function(e) {
                    $rowWrapper.scrollTop(0);
                    //setTimeout(getTopBottom,500);
                };

                scrollToBeginning = function() {
                    if (getTopBottom(true).first === 'item 0') {
                        clearTimeout(inter);
                        scrollToTop();
                        ok(true, 'Reached beginning of list');
                        start();
                        return;
                    }
                    scrollToTop();
                    inter = setTimeout(scrollToBeginning, delay * 2);
                };

                scrollToEnd = function() {
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
                };

                // Utility buttons for one click scroll up/down	, uncomment for visual testing

                /*$('body').append(testyDown).append(testyUp);
                testyDown.on('click',scrollToBottom);
			    testyUp.on('click',scrollToTop);*/

                // Get the initial value of first, last and total
                getTopBottom($, $rowWrapper);

                // Begin scroll to end of the list
                scrollToEnd();
            });

            return _$dfd;
        };

    module('infinite scroll');

    asyncTest('scroll down/up loads the correct number of records', function() {
        setup({
            params: {
                limit: 50
            },
            gridOptions: {
                infiniteScroll: true,
                keyboardNavigation: false,
            },
            delay: delay,
            appendTo: 'body'
        }).then(function(g, options) {
            var collection  = g.get('collection'),
                $rowWrapper = g.$el.find('.row-inner-wrapper'),
                $rows       = g.$el.find('.rows'),
                expectedElements = g.get('limit')*2;

            // set height and widths for visual resize testing
            g.$el.height(400);
            g.$el.width(800);
            // rerender so the height and width changes are pickued up
            g.rerender();

            var scrollToBottom = function(e) {
                    $rowWrapper.scrollTop($rows.height());
                },
                scrollToTop = function(e) {
                    $rowWrapper.scrollTop(0);
                    //setTimeout(getTopBottom,500);
                };
            scrollToBottom();
            setTimeout(function() {
                equal(g.$el.find('tbody').find('tr').length - 1, expectedElements, 'Elements on the DOM equal the expected count - 1st scroll down');
                scrollToBottom();
                setTimeout(function() {
                    equal(g.$el.find('tbody').find('tr').length - 1, expectedElements, 'Elements on the DOM equal the expected count - 2nd scroll down');
                    scrollToTop();
                    setTimeout(function() {
                        equal(g.$el.find('tbody').find('tr').length - 1, expectedElements, 'Elements on the DOM equal the expected count - 1st scroll up');
                        scrollToTop();
                        setTimeout(function() {
                            equal(g.$el.find('tbody').find('tr').length - 1, expectedElements, 'Elements on the DOM equal the expected count - 2nd scroll up');
                            start();
                        }, 600);
                    }, 600);
                }, 600);
            }, 600);
        });
    });

    asyncTest('scroll to end of records works', function() {
        totalRecords = 200;
        Example = mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
        runTest();
    });

    asyncTest('scroll to beginning of records works', function() {
        scrollToBeginning();
    });

    asyncTest('scroll down when total records is a multiple of limit but not a multiple of virtual window size', function() {
        teardown();
        totalRecords = 450;
        Example = mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
        $dfd = runTest({
            limit: 50,
            // windowSize = 2*limit = 100
        });
    });

    // This case does not exist anymore
    // asyncTest('scroll down when total records is not a multiple of limit but is a multiple of virtual window size', function() {
    //     teardown();
    //     totalRecords = 400;
    //     Example = mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
    //     runTest({
    //         limit: 75,
    //     });
    // });

    asyncTest('scroll down when limit, virtual window size and total records have no common factor', function() {
        teardown();
        totalRecords = 287;
        Example = mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
        runTest({
            limit: 30,
            // windowSize = 2*limit = 60
        });
    });

    asyncTest('scroll down when total records is less than the buffer size', function() {
        teardown();
        totalRecords = 90;
        Example = mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
        runTest({
            collectionLimit: 50,
            limit: 50,
            // windowSize = 2*limit = 100
        });
    });

    asyncTest('scroll down when total records is less than the initial collection limit', function() {
        teardown();
        totalRecords = 40;
        Example = mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
        runTest({
            collectionLimit: 50,
            limit: 50,
        });
    });

    asyncTest('scroll down when total records is equal to the initial collection limit', function() {
        teardown();
        totalRecords = 50;
        Example = mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
        runTest({
            collectionLimit: 50,
        });
    });

    asyncTest('scroll down with significantly larger limit and virtual window size values', function() {
        teardown();
        totalRecords = 900;
        Example = mockResource('Example', MeshExample, fixturize(exampleFixtures, totalRecords));
        runTest({
            collectionLimit: 20,
            limit: 300,
            // windowSize = 2*limit = 600
        });
    });

    asyncTest('loading collection without limit and offset,should not display "Loading" when all objects are loaded', function() {
        var ThisExample = mockResource('Example', MeshExample, fixturize(exampleFixtures, 25));
        ThisExample.mockDelay(200);
        var $container = $('<div class=container></div>'),
            grid = GridClass({
                columnModelClass: BasicColumnModel,
                collection: ThisExample.collection(),
                infiniteScroll: true,
            });

        $container.appendTo('body');
        grid.appendTo($container);
        // set height and widths for visual resize testing
        grid.$el.height(400);
        grid.$el.width(800);
        // rerender so the height and width changes are pickued up
        grid.rerender();
        setTimeout(function() {
            var text = grid.$el.find('.rows tr:last-child td .loading-text').text();
            ok(!((grid.options.collection.query.params || {}).limit),'Limit is undefined');
            ok(text && text.trim().toLowerCase().indexOf('loading') < 0,'"Loading.." row is not displayed');
            start();
        }, 220);
    });


    start();
});
