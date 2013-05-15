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
        });
        ok(gp);
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

    asyncTest('select available workflow enables the add button', function() {
        setup().then(function(gp) {
            var g = gp.dataGrid, evt = g.get('selectableEvent');
            equal(gp.addButton.getState('disabled'), true);
            g.$el.find('tbody tr:first td:first').trigger(evt);
            equal(gp.addButton.getState('disabled'), false);
            start();
        });
    });

    asyncTest('select selected workflow enables the remove button', function() {
        setup().then(function(gp) {
            var g1 = gp.dataGrid,
                g2 = gp.selectedDataGrid,
                evt = g1.get('selectableEvent');
            g1.$el.find('tbody tr:first td:first').trigger(evt);
            gp.$el.find('[name=add]').trigger('click');
            equal(gp.removeButton.getState('disabled'), true);
            g2.$el.find('tbody tr:first td:first').trigger(evt);
            equal(gp.removeButton.getState('disabled'), false);
            start();
        });
    });

    asyncTest('select remove selected workflow empties the list', function() {
        setup().then(function(gp) {
            var g1 = gp.dataGrid,
                g2 = gp.selectedDataGrid,
                evt = g1.get('selectableEvent');
            g1.$el.find('tbody tr:first td:first').trigger(evt);
            gp.$el.find('[name=add]').trigger('click');
            g2.$el.find('tbody tr:first td:first').trigger(evt);
            gp.$el.find('[name=remove]').trigger('click');
            equal(g2.$el.find('tbody tr').length, 0);
            start();
        });
    });

    // binding in the test environment can be tricky for some reason - yet to be determined
    // if you have 2 or more (selectable) grids appended to the body that have binding to the
    // collection change event only the last grid in the body will be bound to the `this` value.
    asyncTest('visual gridpicker to play with', function() {
        var gp = GridPicker({
            dataCollection: Workflow.collection(),
            selectedDataCollection: Workflow.collection()
        }).appendTo('body');
        ok(gp);
        start();
    });

    start();
});
