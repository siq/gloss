/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../gridpicker',
    'auxl/test/mock/workflow',
    '../../styles'
], function($, GridPicker, Workflow) {

    var setup = function(options) {
            var gp, dfd = $.Deferred();

            options = $.extend(true, {
                appendTo: '#qunit-fixture'
                }, options);

            Workflow.mockReset();

            gp = window.gp = GridPicker({
                dataCollection: Workflow.collection(),
                selectedDataCollection: Workflow.collection()
            });

            if (options.appendTo) {
                gp.appendTo(options.appendTo);
            }

            $.when(
                gp.get('dataCollection').load(),
                gp.get('selectedDataCollection').load()
            ).then(function() {
                $(function() {
                    dfd.resolve(gp, options);
                });
            });

            return dfd;
        };

    asyncTest('create gridpicker', function() {
        var gp = GridPicker({
            dataCollection: Workflow.collection(),
            selectedDataCollection: Workflow.collection()
        }).appendTo('body');
        ok(true);
        start();
    });

    asyncTest('select/unselect works', function() {
        setup().then(function(gp) {
            var ids = gp.get('dataCollection').mpluck('id');

            // select/unselect all
            gp.select();
            equal(gp.selectedDataGrid.get('models').length,
                gp.get('dataCollection').models.length, 'all data is selected');
            gp.unselect();
            equal(gp.selectedDataGrid.get('models').length, 0, 'no data selected');

            // select/unselect specific ids
            gp.select(ids[0]);
            equal(gp.selectedDataGrid.get('models').length, 1, 'one value is selected');
            gp.unselect(ids[0]);
            equal(gp.selectedDataGrid.get('models').length, 0, 'no data selected');

            gp.select(ids.slice(0,2));
            equal(gp.selectedDataGrid.get('models').length, 2, '2 values is selected');
            gp.unselect(ids.slice(0,2));
            equal(gp.selectedDataGrid.get('models').length, 0, 'no data selected');

            gp.select(ids.slice(0,2));
            equal(gp.selectedDataGrid.get('models').length, 2, '2 values is selected');
            gp.unselect(ids[0]);
            equal(gp.selectedDataGrid.get('models').length, 1, '1 value selected');
            start();
        });
    });

    asyncTest('getValue/setValue works', function() {
        setup().then(function(gp) {
            var ids = gp.get('dataCollection').mpluck('id');

            // calling setValue w/ anything invalid clears selections
            // i.e. null/undefined, [], id not present in the collection
            gp.setValue(ids);
            equal(gp.getValue().length,
                gp.get('dataCollection').models.length, 'all data is selected');
            gp.setValue();
            equal(gp.getValue().length, 0, 'no data selected');

            gp.setValue(ids);
            equal(gp.getValue().length,
                gp.get('dataCollection').models.length, 'all data is selected');
            gp.setValue([]);
            equal(gp.getValue().length, 0, 'no data selected');

            gp.setValue(ids[0]);
            equal(gp.getValue().length, 1, 'one value is selected');
            gp.setValue();
            equal(gp.getValue().length, 0, 'no data selected');

            gp.setValue(ids.slice(0,2));
            equal(gp.getValue().length, 2, '2 values is selected');
            gp.setValue();
            equal(gp.getValue().length, 0, 'no data selected');

            gp.setValue(ids.slice(0,2));
            equal(gp.getValue().length, 2, '2 values is selected');
            gp.setValue(1234);
            equal(gp.getValue().length, 0, 'no data selected');

            // calling setvalue clears any previous selection
            gp.setValue(ids.slice(0,2));
            equal(gp.getValue().length, 2, '2 values is selected');
            gp.setValue(ids[0]);
            equal(gp.getValue().length, 1, '1 value selected');
            start();
        });
    });

    start();
});
