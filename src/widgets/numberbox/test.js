/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../numberbox'
], function($, NumberBox) {
    var numberBox = NumberBox({nodeTemplate: '<input type=number min=-10 max=1000 step=0.0001></input>'}, true);
    test('numberbox instantiation', function() {
        ok(numberBox.prependTo('body'));
    });

    test('_read_precision', function() {
        equal(numberBox._read_precision(10.00), 0);
        equal(numberBox._read_precision(10.001), 3);
        equal(numberBox._read_precision(10.0001), 4);
        equal(numberBox._read_precision(10), 0);
        equal(numberBox._read_precision(1), 0);
    });
    test('_destroy_mantissa', function() {
        equal(numberBox._destroy_mantissa(.001), 1);
        equal(numberBox._destroy_mantissa(0.001), 1);
        equal(numberBox._destroy_mantissa(10.01), 1001);
        equal(numberBox._destroy_mantissa(30.003), 30003);
    });
    test('_mod_float', function() {
        equal(numberBox._mod_float(10.01, 0.01), 0);
        equal(numberBox._mod_float(1.01, 0.01), 0);
        equal(numberBox._mod_float(10.02, 0.02), 0);
        equal(numberBox._mod_float(10.02, 0.03), 0);
        equal(numberBox._mod_float(10.02, 0.001), 0);
        equal(numberBox._mod_float(713.02, 0.02), 0);
    });
    test('_step_is_less_precise_than_input', function() {
        ok(numberBox._step_is_less_precise_than_input(10.001, 0.5));
        ok(!numberBox._step_is_less_precise_than_input(10.01, 0.005));
    });
    test('_passed_contraints', function() {
        ok(numberBox._passes_constraints(1.01, {
            min: 0, max: 2, step: 0.01
        }));
        ok(!numberBox._passes_constraints(1.01, {
            min: 2, max: 10, step: 0.01
        }));
        ok(!numberBox._passes_constraints(1.01, {
            min: -10, max: 1, step: 0.01
        }));
        ok(!numberBox._passes_constraints(1.01, {
            min: 0, max: 2, step: 0.1
        }));
    });
    test('numberbox blank value', function() {
        numberBox.setValue('');
        equal(numberBox.getValue(), null);
        numberBox.setValue('123');
        equal(numberBox.getValue(), '123');
        numberBox.setValue('');
        equal(numberBox.getValue(), null);
    });

    test('disallowed alphabetics', function() {
        numberBox.setValue('');
        numberBox.setValue('abc');
        equal(numberBox.getValue(), null);
    });
    test('min number contraint', function() {
        // Min specified at construction is -10
        numberBox.setValue(-10);
        equal(numberBox.getValue(), -10);
        numberBox.setValue(-100);
        equal(numberBox.getValue(), -10); // Last valid value
        numberBox.setValue(-11);
        equal(numberBox.getValue(), -10); // Last valid value
    });
    test('max number contraint', function() {
        // Max specified at construction is 1000
        numberBox.setValue(10);
        equal(numberBox.getValue(), 10);
        numberBox.setValue(1000);
        equal(numberBox.getValue(), 1000);
        numberBox.setValue(1001);
        equal(numberBox.getValue(), 1000); // Last valid value

    });
    test('step contraint', function() {
        // Step specified at construction is 0.0001
        numberBox.setValue(1);
        equal(numberBox.getValue(), 1);
        numberBox.setValue(1.00001);
        equal(numberBox.getValue(), 1); // Last valid value
        numberBox.setValue(1.002);
        equal(numberBox.getValue(), 1.002);
        numberBox.setValue(999.00005);
        equal(numberBox.getValue(), 1.002); // Last valid valud
    });
    start();
});
