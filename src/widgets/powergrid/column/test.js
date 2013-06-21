/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './../../powergrid',
    './checkboxcolumn',
    './asdatetime',
    './asbytes',
    './asenumeration',
    './asnumber',
    './../asformwidget',
    './../utils'
], function($, _, moment, PowerGrid, CheckBoxColumn, asDateTime, asBytes,
    asEnumeration, asNumber, asFormWidget, utils) {

    var setup = utils.setup,
        BasicColumnModel = utils.BasicColumnModel,
        trim = utils.trim;

    // we only want to run the 'checkbox column' module if we're in a browser
    // where triggering a 'click' event on a checkbox subsequently triggers a
    // 'change' event. since we're lazy and busy, we're just checking for
    // webkit
    if ($.browser.webkit) {
        module('checkbox column');

        var withCheckboxColumn = function(colModelClass) {
            return colModelClass.extend({
                columnClasses: [
                    CheckBoxColumn.extend({defaults: {prop: '_checked'}})
                ].concat(colModelClass.prototype.columnClasses)
            });
        };

        asyncTest('renders checkboxes', function() {
            setup({
                // appendTo: 'body',
                gridOptions: {
                    columnModelClass: withCheckboxColumn(BasicColumnModel)
                }
            }).then(function(g) {
                equal(g.$el.find('[type=checkbox]').length, g.get('models').length+1);
                start();
            });
        });

        asyncTest('checking a checkbox sets the corresponding model prop', function() {
            setup({
                gridOptions: {
                    columnModelClass: withCheckboxColumn(BasicColumnModel)
                }
            }).then(function(g) {
                ok(!g.get('models')[0].get('_checked'));
                g.$el.find('tbody [type=checkbox]').first().trigger('click');
                setTimeout(function() {
                    equal(g.get('models')[0].get('_checked'), true);
                    start();
                }, 15);
            });
        });

        asyncTest('changing model prop sets the corresponding checkbox', function() {
            // for this case we want to make sure the header is unchecked too
            setup({
                appendTo: '#qunit-fixture',
                gridOptions: {
                    columnModelClass: withCheckboxColumn(BasicColumnModel)
                }
            }).then(function(g) {
                // first set everything to checked
                // gecko and trident don't seem to register the click, so change
                // events never fire and this test fails in those browsers
                g.$el.find('thead [type=checkbox]').trigger('click');
                setTimeout(function() {
                    equal(g.$el.find('[type=checkbox]').length,
                        g.get('models').length+1);
                    equal(g.$el.find('[type=checkbox]:checked').length,
                        g.get('models').length+1);
                    _.each(g.get('models'),
                        function(m) { ok(m.get('_checked')); });
                    g.get('models')[0].set('_checked', false);
                    setTimeout(function() {
                        equal(g.get('models')[0].get('_checked'), false);
                        equal(g.$el.find('thead [type=checkbox]:checked').length, 0,
                                'header is unchecked when models change');
                        start();
                    }, 15);
                }, 50);
            });
        });

        asyncTest('checking header checks all', function() {
            setup({
                appendTo: '#qunit-fixture',
                gridOptions: {
                    columnModelClass: withCheckboxColumn(BasicColumnModel)
                }
            }).then(function(g) {
                equal(g.$el.find('[type=checkbox]').length, g.get('models').length+1);
                equal(g.$el.find('[type=checkbox]:checked').length, 0);
                _.each(g.get('models'), function(m) { ok(!m.get('_checked')); });
                // gecko and trident don't seem to register the click, so change
                // events never fire and this test fails in those browsers
                g.$el.find('thead [type=checkbox]').trigger('click');
                setTimeout(function() {
                    equal(g.$el.find('[type=checkbox]').length,
                        g.get('models').length+1);
                    equal(g.$el.find('[type=checkbox]:checked').length,
                        g.get('models').length+1);
                    _.each(g.get('models'),
                        function(m) { ok(m.get('_checked')); });
                    start();
                }, 50);
            });
        });

        asyncTest('changing checkbox column type', function() {
            setup({
                gridOptions: {
                    columnModelClass: withCheckboxColumn(BasicColumnModel)
                },
                appendTo: '#qunit-fixture'
            }).then(function(g) {
                equal(g.$el.find('[type=checkbox]').length, g.get('models').length+1);
                equal(g.$el.find('[type=checkbox]').length, 16);
                g.get('columnModel').columns[0].set('type', 'radio');
                equal(g.$el.find('[type=checkbox]').length, 0);
                equal(g.$el.find('[type=radio]').length, g.get('models').length);
                start();
            });
        });

        asyncTest('selecting all checkboxes does not change disabled ones', function() {
            setup({
                appendTo: '#qunit-fixture',
                gridOptions: {
                    columnModelClass: BasicColumnModel.extend({
                        columnClasses: [
                            CheckBoxColumn.extend({
                                defaults: {prop: '_checked'},
                                _isDisabled: function(model) {
                                    return model.get('default_field') < 100;
                                }
                            })
                        ].concat(BasicColumnModel.prototype.columnClasses)
                    })
                }
            }).then(function(g) {
                equal(g.$el.find('[type=checkbox]').length, g.get('models').length+1);
                equal(g.$el.find('[type=checkbox]:checked').length, 0);
                _.each(g.get('models'), function(m) { ok(!m.get('_checked')); });
                g.$el.find('thead [type=checkbox]').trigger('click');
                setTimeout(function() {
                    equal(g.$el.find('[type=checkbox]').length,
                        g.get('models').length+1);
                    equal(g.$el.find('[type=checkbox]:checked').length, 13);
                    _.each(g.get('models'), function(m) {
                        if (m.get('default_field') < 100) {
                            ok(!m.get('_checked'));
                        } else {
                            ok(m.get('_checked'));
                        }
                    });
                    start();
                }, 15);
            });
        });
    }

    var FormWidgetPowerGrid = PowerGrid.extend();
    asFormWidget.call(FormWidgetPowerGrid.prototype);

    asyncTest('checkbox column with asformwidget', function() {
        setup({
            gridClass: FormWidgetPowerGrid,
            gridOptions: {
                columnModelClass: BasicColumnModel.extend({
                    columnClasses: [CheckBoxColumn.extend()]
                        .concat(BasicColumnModel.prototype.columnClasses)
                })
            }
        }).then(function(g) {
            var $checked, val, cb = g.get('columnModel').columns[0],
                prop = cb.get('prop'),
                models = g.get('models');

            g.setValue(val = [2, 3, 4]);
            deepEqual(_.mpluck(_.mwhere(models, prop, true), 'id'), val);
            equal(($checked = g.$el.find('input:checked')).length, 3);
            $checked.parent().siblings('.col-text_field').each(function(i, el) {
                equal($.trim($(el).text()), 'item ' + (val[i]-1));
            });
            deepEqual(g.getValue(), val);

            g.setValue(val = [7, 8]);
            deepEqual(_.mpluck(_.mwhere(models, prop, true), 'id'), val);
            equal(($checked = g.$el.find('input:checked')).length, 2);
            $checked.parent().siblings('.col-text_field').each(function(i, el) {
                equal($.trim($(el).text()), 'item ' + (val[i]-1));
            });
            deepEqual(g.getValue(), val);

            start();
        });
    });

    asyncTest('checkbox radio column with asformwidget', function() {
        setup({
            appendTo: 'body',
            gridClass: FormWidgetPowerGrid,
            gridOptions: {
                columnModelClass: BasicColumnModel.extend({
                    columnClasses: [CheckBoxColumn.extend({
                        defaults: {type: 'radio'}
                    })].concat(BasicColumnModel.prototype.columnClasses)
                })
            }
        }).then(function(g) {
            var $checked, val, cb = g.get('columnModel').columns[0],
                prop = cb.get('prop'),
                models = g.get('models');

            g.setValue(val = 2);
            deepEqual(_.mpluck(_.mwhere(models, prop, true), 'id'), [val]);
            equal(($checked = g.$el.find('input:checked')).length, 1);
            $checked.parent().siblings('.col-text_field').each(function(i, el) {
                equal($.trim($(el).text()), 'item ' + (val-1));
            });
            deepEqual(g.getValue(), val);

            g.setValue(val = 8);
            deepEqual(_.mpluck(_.mwhere(models, prop, true), 'id'), [val]);
            equal(($checked = g.$el.find('input:checked')).length, 1);
            $checked.parent().siblings('.col-text_field').each(function(i, el) {
                equal($.trim($(el).text()), 'item ' + (val-1));
            });
            deepEqual(g.getValue(), val);

            start();
        });
    });

    module('date column');

    var withDateTimeColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'datetime_field'?
                        asDateTime(c.extend()) : c;
                })
        });
    };

    asyncTest('renders dates correctly', function() {
        setup({
            gridOptions: {
                columnModelClass: withDateTimeColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("' +
                    moment('2012-08-29T14:10:21Z').format('YYYY-MM-DD h:mm A') +
                    '")').length, 15);
            start();
        });
    });

    module('bytes column');

    var withBytesColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'float_field'?
                        asBytes(c.extend()) : c;
                })
        });
    };

    asyncTest('renders bytes correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withBytesColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("532.26 MB")').length, 1);
            start();
        });
    });

    asyncTest('renders null bytes correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withBytesColumn(BasicColumnModel),
                collectionMap: function(models) {
                    if (models.length > 0) {
                        models[0].set('float_field', null);
                    }
                    return models;
                }
            }
        }).then(function(g) {
            equal(trim(g.$el.find('tr:eq(1) td:eq(5)').text()), '');
            start();
        });
    });

    module('number column');

    var withNumberColumn = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'default_field'?
                        asNumber(c.extend()) : c;
                })
        });
    };

    asyncTest('renders numbers correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withNumberColumn(BasicColumnModel)
            }
        }).then(function(g) {
            var $el = g.$el.find('td:contains("2,007,104")');
            equal($el.length, 1);
            equal(trim($el.text()), "2,007,104");
            start();
        });
    });

    asyncTest('renders null values correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withNumberColumn(BasicColumnModel),
                collectionMap: function(models) {
                    if (models.length > 0) {
                        models[0].set('default_field', null);
                    }
                    return models;
                }
            }
        }).then(function(g) {
            equal(trim(g.$el.find('tr:eq(1) td:eq(6)').text()), '');
            start();
        });
    });

    var withNumberColumnAndTwoDecimalPlaces = function(colModelClass) {
        return colModelClass.extend({
            columnClasses: _.map(colModelClass.prototype.columnClasses,
                function(c) {
                    return c.prototype.defaults.name === 'default_field'?
                        asNumber(c.extend(), {decimalPlaces: 2}) : c;
                })
        });
    };

    asyncTest('renders two decimal palces correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withNumberColumnAndTwoDecimalPlaces(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("2,007,104.00")').length, 1);
            start();
        });
    });

    module('enumeration column');

    var mapping = { 1:'One', 2: 'Two', 3:'Three'}, 
        withEnumerationColumn = function(colModelClass) {
            return colModelClass.extend({
                columnClasses: _.map(colModelClass.prototype.columnClasses,
                    function(c) {
                        return c.prototype.defaults.name === 'enumeration_field'?
                                asEnumeration(c.extend(), {mapping: mapping}) : c;
                    })
            });
        };

    asyncTest('renders enumeration column correctly', function() {
        setup({
            appendTo: '#qunit-fixture',
            gridOptions: {
                columnModelClass: withEnumerationColumn(BasicColumnModel)
            }
        }).then(function(g) {
            equal(g.$el.find('td:contains("One")').length, 5);
            equal(g.$el.find('td:contains("Two")').length, 5);
            equal(g.$el.find('td:contains("Three")').length, 5);
            start();
        });
    });

    start();
});
