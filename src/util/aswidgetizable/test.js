/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../aswidgetizable',
    './../../widgets/simpleview',
    './../../widgets/button',
    './../../widgets/checkbox',
    './../../widgets/textbox',
    './../../widgets/numberbox',
    './../../widgets/selectbox',
    './../../widgets/radiogroup',
    './../../widgets/togglegroup',
    './../../widgets/checkboxgroup',
    './../../widgets/multiselect',
    './../../widgets/datepicker',
    'text!./temp1.mtpl',
    'text!./temp2.mtpl'
], function($, asWidgetizable, SimpleView, Button, CheckBox, TextBox,
    NumberBox, SelectBox, RadioGroup, ToggleGroup, CheckBoxGroup, 
    Multiselect, DatePicker, template1, template2) {

    var View1 = SimpleView.extend({
            template: template1
        }),
        View2 = SimpleView.extend({
            template: template2
        });
    asWidgetizable.call(View1.prototype);
    asWidgetizable.call(View2.prototype);

    test('correctly widgetize descendents', function() {
        var view = View1(),
            widgets = view.widgets;
        ok(widgets[0]   instanceof Button,              'button 1');
        ok(widgets[1]   instanceof Button,              'button 2');

        ok(widgets[2]   instanceof CheckBox,            'checkbox');

        ok(widgets[3]   instanceof TextBox,             'textbox 1');
        ok(widgets[4]   instanceof TextBox,             'textbox 2');
        ok(widgets[5]   instanceof TextBox,             'textbox 3');
        ok(widgets[6]   instanceof TextBox,             'textbox 4');

        ok(widgets[7]   instanceof NumberBox,           'numberbox');

        ok(widgets[8]   instanceof SelectBox,           'selectbox 1');
        ok(widgets[9]   instanceof SelectBox,           'selectbox 2');

        ok(widgets[10]  instanceof RadioGroup,          'radiogroup');

        ok(widgets[11]  instanceof ToggleGroup,         'togglegroup');

        ok(widgets[12]  instanceof CheckBoxGroup,       'checkboxgroup');

        ok(widgets[13]  instanceof TextBox,             'filedset textbox 1');
        ok(widgets[14]  instanceof TextBox,             'filedset textbox 2');
        ok(widgets[15]  instanceof TextBox,             'filedset textbox 3');
        ok(widgets[16]  instanceof TextBox,             'filedset textbox 4');

        ok(widgets[17]  instanceof Multiselect,         'multiselect 1');
        ok(widgets[18]  instanceof Multiselect,         'multiselect 2');

        ok(widgets[19]  instanceof DatePicker,          'datepicker');
    });

    test('getWidget with name OR data-bind attribute works', function() {
        var view = View2(),
            widgets = view.widgets;

        equal(view.getWidget('foo'), widgets[0], 'foo button');
        equal(view.getWidget('barvalue'), widgets[1], 'barvalue textbox');
    });

    test('getWidget with name AND data-bind attribute works', function() {
        var view = View2(),
            widgets = view.widgets;

        equal(view.getWidget('baz'), widgets[2], 'baz button');
        equal(view.getWidget('biz'), widgets[3], 'biz bing button');
        equal(view.getWidget('biz'), view.getWidget('bing'), 'biz bing button');
    });

    start();

});

