/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../aswidgetizable',
    './../../views/simpleview',
    './../../widgets/user_inputs/button',
    './../../widgets/user_inputs/checkbox',
    './../../widgets/user_inputs/textbox',
    './../../widgets/user_inputs/numberbox',
    './../../widgets/user_inputs/selectbox',
    './../../widgets/user_inputs/radiogroup',
    './../../widgets/user_inputs/togglegroup',
    './../../widgets/user_inputs/checkboxgroup',
    './../../widgets/user_inputs/multiselect',
    './../../widgets/user_inputs/datepicker',
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
            widgets = view.options.widgets;
        ok(widgets.button1              instanceof Button,              'button 1');
        ok(widgets.button2              instanceof Button,              'button 2');

        ok(widgets.checkbox1            instanceof CheckBox,            'checkbox');

        ok(widgets.textbox1             instanceof TextBox,             'textbox 1');
        ok(widgets.textbox2             instanceof TextBox,             'textbox 2');
        ok(widgets.textbox3             instanceof TextBox,             'textbox 3');
        ok(widgets.textbox4             instanceof TextBox,             'textbox 4');

        ok(widgets.numberbox1.type === 'NumberBox', 'numberbox');

        ok(widgets.selectbox1           instanceof SelectBox,           'selectbox 1');
        ok(widgets.selectbox2           instanceof SelectBox,           'selectbox 2');

        ok(widgets.radiogroup1          instanceof RadioGroup,          'radiogroup');

        ok(widgets.togglegroup1         instanceof ToggleGroup,         'togglegroup');

        ok(widgets.checkboxgroup1       instanceof CheckBoxGroup,       'checkboxgroup');

        ok(widgets.fieldset1widget1     instanceof TextBox,             'filedset textbox 1');
        ok(widgets.fieldset1widget2     instanceof TextBox,             'filedset textbox 2');
        ok(widgets.fieldset1widget3     instanceof TextBox,             'filedset textbox 3');
        ok(widgets.fieldset1widget4     instanceof TextBox,             'filedset textbox 4');

        ok(widgets.multiselect1         instanceof Multiselect,         'multiselect 1');
        ok(widgets['my-multiselect2']   instanceof Multiselect,         'multiselect 2');

        ok(widgets.date                 instanceof DatePicker,          'datepicker');
    });

    test('getWidget with name OR data-bind attribute works', function() {
        var view = View2(),
            widgets = view.options.widgets;

        ok(view.getWidget('foo') === widgets.foo, 'foo button');
        ok(view.getWidget('barvalue') === widgets.barvalue, 'barvalue textbox');
    });

    test('getWidget with name AND data-bind attribute works', function() {
        var view = View2(),
            widgets = view.options.widgets;

        ok(view.getWidget('baz') === widgets.baz, 'baz button');
        ok(view.getWidget('biz') === widgets.biz, 'biz bing button');

        // we no longer support this behavior -- widgetize preferences 'name'
        // over 'data-bind' when making widgets
        // ok(view.getWidget('biz') === view.getWidget('bing'), 'biz bing button');
    });

    start();

});

