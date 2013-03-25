/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/

// this test file uses the powergrid for validating the collectionviewable.
// collectionviewable is mixed into the powergrid by default via the
// functional mixin ascollectionviewable.

define([
    'vendor/jquery',
    'vendor/underscore',
    './../powergrid',
    'mesh/tests/mockedexample',
    'mesh/tests/examplefixtures',
    './../powergrid/utils'
], function($, _, PowerGrid, Example, exampleFixtures, utils) {

    var BasicColumnModel = utils.BasicColumnModel,
        setup = utils.setup,
        trim = utils.trim;

    asyncTest('calling `show` reloads the colleciton', function() {
        setup().then(function(g, options) {
            var newLimit = 10;
            equal(g.get('models').length, options.params.limit);

            g.get('collection').reset({limit: newLimit});
            g.show();
            setTimeout(function() {
                equal(g.get('models').length, newLimit);                
                start();
            }, 15);
        });
    });

    asyncTest('collectionviewable only extends show method', function() {
        setup().then(function(g, options) {
            g.hide();
            ok(g.$el.hasClass('hidden'), 'grid is hidden');
            g.show();
            ok(!g.$el.hasClass('hidden'), 'grid is no longer hidden');
            start();
        });
    });

    start();
});

