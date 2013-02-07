/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    './../widgetize',
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
    'text!./html1.html',
    'text!./html2.html'
], function($, widgetize, Button, CheckBox, TextBox, NumberBox, SelectBox,
    RadioGroup, ToggleGroup, CheckBoxGroup, Multiselect, DatePicker, html1,
    html2) {

    test('correctly group widgets', function() {
        var widgets = widgetize($(html1));
        ok(widgets[0] instanceof Button,    'item 0 is a Button');
        ok(widgets[1] instanceof TextBox,   'item 1 is a TextBox');
        ok(widgets[2] instanceof CheckBox,  'item 2 is a CheckBox');
        ok(widgets[3] instanceof NumberBox, 'item 3 is a NumberBox');
    });

    test('correctly widgetize descendents', function() {
        var widgets = widgetize($(html2));
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

    test('set label "for" attribute', function() {
        var $el = $(html2), widgets = widgetize($el);

        ok($el.find('label:contains("Text box 1 label")').attr('for') != null);
        equal(widgets[3].$node.attr('id'),
            $el.find('label:contains("Text box 1 label")').attr('for'));

        ok($el.find('label[data-for="radiogroup1:value1"]').attr('for') != null,
            'radiogroup labels\' "for" attrubute has been set');
        equal(
            $el.find('label[data-for="radiogroup1:value1"]').attr('for'),
            widgets[10].$node.find('[type=radio]').first().attr('id')
            );

        ok($el.find('label[data-for="checkboxgroup1:value1"]').attr('for') != null,
            'checkboxgroup labels\' "for" attrubute has been set');
        equal(
            $el.find('label[data-for="checkboxgroup1:value1"]').attr('for'),
            widgets[12].$node.find('[type=checkbox]').first().attr('id')
            );
    });

    test('set label "for" attribute on data-bind-named input', function() {
        var $el = $(html2), widgets = widgetize($el);

        ok($el.find('label:contains("Multi-select 1 label")').attr('for') != null);
        equal(widgets[17].$node.attr('id'),
            $el.find('label:contains("Multi-select 1 label")').attr('for'));
    });

    test('setting the messagelist for an input', function() {
        var widgets = widgetize($(html2));

        ok(widgets[3].options.messageList);
    });

    // TODO: make sure messagelist doesnt double-instantiate

    start();

});

