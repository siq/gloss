/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    '../powergridsearch',
    '../../powergrid',
    'mesh/tests/mockedexample',
    'mesh/tests/examplefixtures',
    './../utils',
    'mesh/tests/mockutils'
], function($, _, PowerGridSearch, PowerGrid, Example, examplefixtures, utils, mockResource) {
    var setup = utils.setup;

    var MySearch = PowerGridSearch.extend({
        defaults: {searchParam: 'integer_field__gt'}
    });
    asyncTest('search widget correctly maintains limit', function() {
        var appendTo = '#qunit-fixtire';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(500);

            search.submit().then(function() {
                ok(g.get('models').length <= originalLength,
                    'original limit was preserved');
                start();
            });
        });
    });

    asyncTest('correctly sets search params', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                _.each(g.get('models'), function(m) {
                    ok(m.get('integer_field') > cutoff,
                        'filter worked correctly for '+m.get('text_field'));
                });
                ok(g.get('models').length < originalLength);
                start();
            });
        });
    });

    asyncTest('correctly clears search params', function() {
        var appendTo = '#qunit-fixture', cutoff1 = 993, cutoff2 = 994;
        appendTo = 'body';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff1);

            search.submit().then(function() {
                var cutoff1Length = g.get('models').length;
                _.each(g.get('models'), function(m) {
                    ok(m.get('integer_field') > cutoff1,
                        'filter worked correctly for '+m.get('text_field'));
                });
                ok(g.get('models').length < originalLength);
                search.getWidget('q').setValue(cutoff2);
                search.submit().then(function() {
                    setTimeout(function() {
                        _.each(g.get('models'), function(m) {
                            ok(m.get('integer_field') > cutoff2,
                                'filter worked correctly for '+m.get('text_field'));
                        });
                        ok(g.get('models').length < originalLength);
                        ok(g.get('models').length > cutoff1Length
                            || (cutoff1Length === 0 && g.get('models').length === cutoff1Length));

                        search.getWidget('clear').trigger('click');
                        setTimeout(function() {
                            equal(g.get('models').length, originalLength);
                            start();
                        }, 15);
                    }, 15);
                });
            });
        });
    });

    asyncTest('correctly causes the "filtered" class to be applied', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            equal(g.$el.hasClass('filtered'), false);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                equal(g.$el.hasClass('filtered'), true);

                search.getWidget('clear').trigger('click');

                setTimeout(function() {
                    equal(g.$el.hasClass('filtered'), false);
                    start();
                }, 50);
            });
        });
    });

    asyncTest('disabled while searching', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                equal(search.getWidget('q').getState('disabled'),      false);
                equal(search.getWidget('clear').getState('disabled'),  false);
                equal(search.getWidget('search').getState('disabled'), false);
                start();
            });

            equal(search.getWidget('q').getState('disabled'),      true);
            equal(search.getWidget('clear').getState('disabled'),  true);
            equal(search.getWidget('search').getState('disabled'), true);
        });
    });

    test('testing _makeQueryParams for pre-filtered collection', function() {
        var cutoff = 500,
            collection = Example.collection({query : {'required_field':'123'}}),
            search = MySearch(undefined, {collection: collection}).appendTo('#qunit-fixture'),
            queryParams;

        // first apply a filter and make sure previous filter and new filter both are present
        search.getWidget('q').setValue(cutoff);
        queryParams = search._makeQueryParams();

        ok (queryParams.query !== null);
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'required_field'));
        ok(_.has(queryParams.query, 'integer_field__gt'));


        // Now clear filter and make sure previous filter remains but new filter gets removed
        search.getWidget('q').setValue('');
        queryParams = search._makeQueryParams();
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'required_field'));
        equal(_.has(queryParams.query, 'integer_field__gt'), false);
    });

    test('testing _makeQueryParams for clear search scenario', function() {
        var cutoff = 500,
            collection = Example.collection(),
            search = MySearch(undefined, {collection: collection}).appendTo('#qunit-fixture'),
            queryParams;

        // first apply a filter and make sure previous filter is part of the params
        search.getWidget('q').setValue(cutoff);
        queryParams = search._makeQueryParams();

        ok (queryParams.query !== null);
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'integer_field__gt'));

        // Now clear filter and make sure query element is null
        search.getWidget('q').setValue('');
        queryParams = search._makeQueryParams();
        ok (queryParams.query == null);
    });

    var assertEnabled = function(g, isEnabled, phase) {
        equal(g.$el.hasClass('disabled'), !isEnabled,
                'grid .disabled class correctly set ' + phase);
        equal(!!g.spinner.visible, !isEnabled,
                'spinner .visible prop correctly set ' + phase);
    };

    asyncTest('search disables powergrid', function() {
        var appendTo = '#qunit-fixture';
        setup({appendTo: appendTo}).then(function(g) {
            var delay, originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')}).appendTo(appendTo);
            g.get('collection').load().then(function() {
                Example.mockDelay(delay = 50);
                // set timout to allow collection 'update' to fire
                setTimeout(function() {
                    assertEnabled(g, true, 'before search');
                    search.getWidget('q').setValue(500);
                    var dfd = search.submit();
                    assertEnabled(g, false, 'just after search started');
                    setTimeout(function() {
                        assertEnabled(g, false, 'half way through search');
                        equal(dfd.state(), 'pending', 'search is still running');
                        dfd.then(function() {
                            assertEnabled(g, true, 'after search is complete');
                            start();
                        });
                    }, delay/2);
                }, 0);
            });
        });
    });

    asyncTest('failed search disables and re-enables powergrid', function() {
        setup().then(function(g) {
            var delay, originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')});
            g.get('collection').load().then(function() {
                // set timout to allow collection 'update' to fire
                setTimeout(function() {
                    Example.mockDelay(delay = 50).mockFailure(true);
                    assertEnabled(g, true, 'before search');
                    search.getWidget('q').setValue(500);
                    var dfd = search.submit();
                    assertEnabled(g, false, 'just after search started');
                    setTimeout(function() {
                        assertEnabled(g, false, 'half way through search');
                        equal(dfd.state(), 'pending', 'search is still running');
                        dfd.then(function() {
                            ok(false, 'should have failed...');
                            start();
                        }, function() {
                            assertEnabled(g, true, 'after search is complete');
                            start();
                        });
                    }, delay/2);
                }, 0);
            });
        });
    });

    asyncTest('changing collection un-registers event handlers', function() {
        setup().then(function(g) {
            var delay, originalLength = g.get('models').length,
                search = MySearch(null, {collection: Example.collection()}),
                firstCollection = g.get('collection');
            g.set('collection', search.options.collection);
            firstCollection.on('powerGridSearchStart', function() {
                ok(false, 'powerGridSearchStart triggered on old colleciton');
            }).on('powerGridSearchCompleted', function() {
                ok(false, 'powerGridSearchCompleted triggered on old colleciton');
            });
            g.get('collection').load().then(function() {
                // set timout to allow collection 'update' to fire
                setTimeout(function() {
                    Example.mockDelay(delay = 50).mockFailure(true);
                    assertEnabled(g, true, 'before search');
                    search.getWidget('q').setValue(500);
                    var dfd = search.submit();
                    assertEnabled(g, false, 'just after search started');
                    setTimeout(function() {
                        assertEnabled(g, false, 'half way through search');
                        equal(dfd.state(), 'pending', 'search is still running');
                        dfd.then(function() {
                            ok(false, 'should have failed...');
                            start();
                        }, function() {
                            assertEnabled(g, true, 'after search is complete');
                            start();
                        });
                    }, delay/2);
                }, 0);
            });
        });
    });

    asyncTest('synthetic submit event on text field', function() {
        var appendTo = 'body';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                $div = $('<div>').appendTo(appendTo),
                search = MySearch($div, {collection: g.get('collection')})
                            .appendTo(appendTo),
                q = search.getWidget('q');

            q.$node.focus();
            q.setValue(993).trigger($.Event('keyup', {which: 13}));

            setTimeout(function() {
                var models = g.get('models');
                ok(models.length < originalLength);
                _.each(models, function(m) {ok(m.get('integer_field') > 993);});
                start();
            }, 0);
        });
    });

    asyncTest('synthetic submit event on text field', function() {
        var appendTo = '#qunit-fixture';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                $div = $('<div>').appendTo(appendTo),
                search = MySearch($div, {collection: g.get('collection')})
                            .appendTo(appendTo),
                s = search.getWidget('q');

            search.getWidget('q').setValue(993);
            s.$node.focus().trigger($.Event('keyup', {which: 13}));

            setTimeout(function() {
                var models = g.get('models');
                ok(models.length < originalLength);
                _.each(models, function(m) {ok(m.get('integer_field') > 993);});
                start();
            }, 0);
        });

    });

    asyncTest('grid selections are cleared on filter search ', function() {
        var appendTo = '#qunit-fixture',
            total = 15,
            fixtures = examplefixtures.slice(0, total);
            ExampleResource = mockResource('Example', Example, fixtures);
        setup({
            gridOptions: {selectable: true},
            appendTo: appendTo
        }).then(function(g) {
            var collection = ExampleResource.collection(),
                search = MySearch(null, {
                    collection: collection
                }).appendTo(appendTo);
            g.set('collection', collection);
            collection.load().then(function(allModels) {
                var filter = 500,
                    unfilteredModel = _.find(allModels, function(m) {
                        return m.integer_field > filter;
                    });
                g.select(unfilteredModel);
                equal(unfilteredModel, g.selected(), 'unfilteredModel is selected');
                search.getWidget('q').setValue(filter);

                search.submit().then(function() {
                    setTimeout(function() {
                        ok(g.get('models').length <= allModels.length, 'filtered models');
                        ok(!g.selected(), 'no models selected');
                        start();
                    }, 10);
                }, function() {
                    ok(false, 'failed to submit filter');
                    start();
                });
            }, function() {
                ok(false, 'failed to load colleciton');
                start();
            });
        });
    });

    asyncTest('search widget correctly maintains limit', function() {
        var appendTo = '#qunit-fixtire';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(500);

            search.submit().then(function() {
                ok(g.get('models').length <= originalLength,
                    'original limit was preserved');
                start();
            });
        });
    });

    asyncTest('correctly sets search params', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                _.each(g.get('models'), function(m) {
                    ok(m.get('integer_field') > cutoff,
                        'filter worked correctly for '+m.get('text_field'));
                });
                ok(g.get('models').length < originalLength);
                start();
            });
        });
    });

    asyncTest('correctly clears search params', function() {
        var appendTo = '#qunit-fixture', cutoff1 = 993, cutoff2 = 994;
        appendTo = 'body';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff1);

            search.submit().then(function() {
                var cutoff1Length = g.get('models').length;
                _.each(g.get('models'), function(m) {
                    ok(m.get('integer_field') > cutoff1,
                        'filter worked correctly for '+m.get('text_field'));
                });
                ok(g.get('models').length < originalLength);
                search.getWidget('q').setValue(cutoff2);
                search.submit().then(function() {
                    setTimeout(function() {
                        _.each(g.get('models'), function(m) {
                            ok(m.get('integer_field') > cutoff2,
                                'filter worked correctly for '+m.get('text_field'));
                        });
                        ok(g.get('models').length < originalLength);
                        ok(g.get('models').length > cutoff1Length
                            || (cutoff1Length === 0 && g.get('models').length === cutoff1Length));

                        search.getWidget('clear').trigger('click');
                        setTimeout(function() {
                            equal(g.get('models').length, originalLength);
                            start();
                        }, 15);
                    }, 15);
                });
            });
        });
    });

    asyncTest('correctly causes the "filtered" class to be applied', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            equal(g.$el.hasClass('filtered'), false);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                equal(g.$el.hasClass('filtered'), true);

                search.getWidget('clear').trigger('click');

                setTimeout(function() {
                    equal(g.$el.hasClass('filtered'), false);
                    start();
                }, 50);
            });
        });
    });

    asyncTest('disabled while searching', function() {
        var appendTo = '#qunit-fixture', cutoff = 500;
        setup({appendTo: appendTo}).then(function(g) {
            var search = MySearch(null, {collection: g.get('collection')})
                            .appendTo(appendTo);

            search.getWidget('q').setValue(cutoff);

            search.submit().then(function() {
                equal(search.getWidget('q').getState('disabled'),      false);
                equal(search.getWidget('clear').getState('disabled'),  false);
                equal(search.getWidget('search').getState('disabled'), false);
                start();
            });

            equal(search.getWidget('q').getState('disabled'),      true);
            equal(search.getWidget('clear').getState('disabled'),  true);
            equal(search.getWidget('search').getState('disabled'), true);
        });
    });

    test('testing _makeQueryParams for pre-filtered collection', function() {
        var cutoff = 500,
            collection = Example.collection({query : {'required_field':'123'}}),
            search = MySearch(undefined, {collection: collection}).appendTo('#qunit-fixture'),
            queryParams;

        // first apply a filter and make sure previous filter and new filter both are present
        search.getWidget('q').setValue(cutoff);
        queryParams = search._makeQueryParams();

        ok (queryParams.query !== null);
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'required_field'));
        ok(_.has(queryParams.query, 'integer_field__gt'));


        // Now clear filter and make sure previous filter remains but new filter gets removed
        search.getWidget('q').setValue('');
        queryParams = search._makeQueryParams();
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'required_field'));
        equal(_.has(queryParams.query, 'integer_field__gt'), false);
    });

    test('testing _makeQueryParams for clear search scenario', function() {
        var cutoff = 500,
            collection = Example.collection(),
            search = MySearch(undefined, {collection: collection}).appendTo('#qunit-fixture'),
            queryParams;

        // first apply a filter and make sure previous filter is part of the params
        search.getWidget('q').setValue(cutoff);
        queryParams = search._makeQueryParams();

        ok (queryParams.query !== null);
        equal(_.isEmpty(queryParams.query), false);
        ok(_.has(queryParams.query, 'integer_field__gt'));

        // Now clear filter and make sure query element is null
        search.getWidget('q').setValue('');
        queryParams = search._makeQueryParams();
        ok (queryParams.query == null);
    });

    var assertEnabled = function(g, isEnabled, phase) {
        equal(g.$el.hasClass('disabled'), !isEnabled,
                'grid .disabled class correctly set ' + phase);
        equal(!!g.spinner.visible, !isEnabled,
                'spinner .visible prop correctly set ' + phase);
    };

    asyncTest('search disables powergrid', function() {
        var appendTo = '#qunit-fixture';
        setup({appendTo: appendTo}).then(function(g) {
            var delay, originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')}).appendTo(appendTo);
            g.get('collection').load().then(function() {
                Example.mockDelay(delay = 50);
                // set timout to allow collection 'update' to fire
                setTimeout(function() {
                    assertEnabled(g, true, 'before search');
                    search.getWidget('q').setValue(500);
                    var dfd = search.submit();
                    assertEnabled(g, false, 'just after search started');
                    setTimeout(function() {
                        assertEnabled(g, false, 'half way through search');
                        equal(dfd.state(), 'pending', 'search is still running');
                        dfd.then(function() {
                            assertEnabled(g, true, 'after search is complete');
                            start();
                        });
                    }, delay/2);
                }, 0);
            });
        });
    });

    asyncTest('failed search disables and re-enables powergrid', function() {
        setup().then(function(g) {
            var delay, originalLength = g.get('models').length,
                search = MySearch(null, {collection: g.get('collection')});
            g.get('collection').load().then(function() {
                // set timout to allow collection 'update' to fire
                setTimeout(function() {
                    Example.mockDelay(delay = 50).mockFailure(true);
                    assertEnabled(g, true, 'before search');
                    search.getWidget('q').setValue(500);
                    var dfd = search.submit();
                    assertEnabled(g, false, 'just after search started');
                    setTimeout(function() {
                        assertEnabled(g, false, 'half way through search');
                        equal(dfd.state(), 'pending', 'search is still running');
                        dfd.then(function() {
                            ok(false, 'should have failed...');
                            start();
                        }, function() {
                            assertEnabled(g, true, 'after search is complete');
                            start();
                        });
                    }, delay/2);
                }, 0);
            });
        });
    });

    asyncTest('changing collection un-registers event handlers', function() {
        setup().then(function(g) {
            var delay, originalLength = g.get('models').length,
                search = MySearch(null, {collection: Example.collection()}),
                firstCollection = g.get('collection');
            g.set('collection', search.options.collection);
            firstCollection.on('powerGridSearchStart', function() {
                ok(false, 'powerGridSearchStart triggered on old colleciton');
            }).on('powerGridSearchCompleted', function() {
                ok(false, 'powerGridSearchCompleted triggered on old colleciton');
            });
            g.get('collection').load().then(function() {
                // set timout to allow collection 'update' to fire
                setTimeout(function() {
                    Example.mockDelay(delay = 50).mockFailure(true);
                    assertEnabled(g, true, 'before search');
                    search.getWidget('q').setValue(500);
                    var dfd = search.submit();
                    assertEnabled(g, false, 'just after search started');
                    setTimeout(function() {
                        assertEnabled(g, false, 'half way through search');
                        equal(dfd.state(), 'pending', 'search is still running');
                        dfd.then(function() {
                            ok(false, 'should have failed...');
                            start();
                        }, function() {
                            assertEnabled(g, true, 'after search is complete');
                            start();
                        });
                    }, delay/2);
                }, 0);
            });
        });
    });

    asyncTest('synthetic submit event on text field', function() {
        var appendTo = 'body';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                $div = $('<div>').appendTo(appendTo),
                search = MySearch($div, {collection: g.get('collection')})
                            .appendTo(appendTo),
                q = search.getWidget('q');

            q.$node.focus();
            q.setValue(993).trigger($.Event('keyup', {which: 13}));

            setTimeout(function() {
                var models = g.get('models');
                ok(models.length < originalLength);
                _.each(models, function(m) {ok(m.get('integer_field') > 993);});
                start();
            }, 0);
        });
    });

    asyncTest('synthetic submit event on text field', function() {
        var appendTo = '#qunit-fixture';
        setup({appendTo: appendTo}).then(function(g) {
            var originalLength = g.get('models').length,
                $div = $('<div>').appendTo(appendTo),
                search = MySearch($div, {collection: g.get('collection')})
                            .appendTo(appendTo),
                s = search.getWidget('q');

            search.getWidget('q').setValue(993);
            s.$node.focus().trigger($.Event('keyup', {which: 13}));

            setTimeout(function() {
                var models = g.get('models');
                ok(models.length < originalLength);
                _.each(models, function(m) {ok(m.get('integer_field') > 993);});
                start();
            }, 0);
        });

    });

    asyncTest('grid selections are cleared on filter search ', function() {
        var appendTo = '#qunit-fixture',
            total = 15,
            fixtures = examplefixtures.slice(0, total);
            ExampleResource = mockResource('Example', Example, fixtures);
        setup({
            gridOptions: {selectable: true},
            appendTo: appendTo
        }).then(function(g) {
            var collection = ExampleResource.collection(),
                search = MySearch(null, {
                    collection: collection
                }).appendTo(appendTo);
            g.set('collection', collection);
            collection.load().then(function(allModels) {
                var filter = 500,
                    unfilteredModel = _.find(allModels, function(m) {
                        return m.integer_field > filter;
                    });
                g.select(unfilteredModel);
                equal(unfilteredModel, g.selected(), 'unfilteredModel is selected');
                search.getWidget('q').setValue(filter);

                search.submit().then(function() {
                    setTimeout(function() {
                        ok(g.get('models').length <= allModels.length, 'filtered models');
                        ok(!g.selected(), 'no models selected');
                        start();
                    }, 10);
                }, function() {
                    ok(false, 'failed to submit filter');
                    start();
                });
            }, function() {
                ok(false, 'failed to load colleciton');
                start();
            });
        });
    });

    // Begin text field search tests
    (function() {
        var specialModel = {boolean_field: false,
                            datetime_field: "2012-08-29T14:10:21Z",
                            default_field: 560,
                            enumeration_field: 1,
                            float_field: 0.5581193703703704,
                            id: 6,
                            integer_field: 247,
                            required_field: null,
                            text_field: "$tylesheet[~a%b]" },
            total = 5,
            fixtures = examplefixtures.slice(0, total);
        fixtures.push( specialModel );

        var ExampleResource = mockResource('Example', Example, fixtures),
            textSearchCollection = ExampleResource.collection(),

            grid = PowerGrid($.extend({ 
                columnModelClass: utils.BasicColumnModel,
                collection: textSearchCollection, // This is where the error is occuring
                collectionLoadArgs: {limit: 10}
            }, {})).appendTo( $('body') ),
            search = PowerGridSearch(null, {collection: textSearchCollection,
                                            searchParam: 'text_field__icontains'}).appendTo( $('body') );

        asyncTest('grid search finds models with normal characters ', function() {
            textSearchCollection.load().then(function( allModels ) {
                var normalSearchString = 'item 3';
                
                search.getWidget('q').setValue( normalSearchString );
                search.$node.focus();
                
                search.submit().then(function() {
                    setTimeout(function() {
                        ok( textSearchCollection.models.length === 1, 'normal character model found');
                        start();
                    }, 10);
                }, function() {
                    ok( false, 'failed to submit search on: ' + arguments[0][1].query[0].message );
                    start();
                });
            }, function() {
                ok( false, 'failed to load collection' );
                start();
            });
        });
/*        
        asyncTest('grid search finds models with special characters' , function() {
            var specialCharacterSearchString = '$tylesheet[~a%b]';
            
            textSearchCollection.load().then(function( allModels ) {
                search.getWidget('q').setValue( specialCharacterSearchString );
                search.submit().then(function() {
                    setTimeout(function() {
                        ok( collection.models.length === 1, 'special character model found');
                        start();
                    }, 10);
                }, function() {
                    ok( false, 'special character search failed');
                    start();
                });
                
            }, function() {
                ok( false, 'failed to load collection' );
                start();
            });
        });
*/
    })();
    start();
});
