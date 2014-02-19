define([
    'vendor/jquery',
    'vendor/underscore',
    './../widgets/base/widget',
    './../widgets/user_inputs/button',
    './../widgets/user_inputs/numberbox',
    './../widgets/user_inputs/checkbox',
    './../widgets/user_inputs/radiogroup',
    './../widgets/user_inputs/togglegroup',
    './../widgets/user_inputs/checkboxgroup',
    './../widgets/user_inputs/selectbox',
    './../widgets/user_inputs/textbox',
    './../widgets/user_display/messagelist',
    './../widgets/user_inputs/multiselect',
    './../widgets/user_inputs/datepicker'
], function($, _, Widget, Button, NumberBox, CheckBox, RadioGroup, ToggleGroup,
    CheckBoxGroup, SelectBox, TextBox, MessageList, MultiSelect, DatePicker) {

    var registry = Widget().registry;

    // if the element matches the selector on the left, it will be instantiated
    // with the widget on the right. the order of this list matters.
    var widgetMap = [
        ['button', Button],
        ['input[type=checkbox]', CheckBox],
        ['input[type=text],input[type=password],input[type=search],input[type=email]', TextBox],
        ['input[type=submit],input[type=reset]', Button],
        ['input[type=number]', NumberBox],
        ['div.multiselect, select.multiselect, select[multiple]', MultiSelect],
        ['select:not([multiple], .multiselect)', SelectBox],
        ['textarea', TextBox],
        ['div.radiogroup', RadioGroup],
        ['div.togglegroup', ToggleGroup],
        ['div.checkboxgroup', CheckBoxGroup],
        ['.datepicker', DatePicker]
    ];

    var widgetSelector = ['button', '.datepicker', 'div.radiogroup', 'input',
        'select', 'div.select', 'textarea', 'div.togglegroup',
        'div.checkboxgroup', 'div.multiselect'].join(',');

    function makeWidgets($el) {
        var result = [];
        $el.find(widgetSelector).each(function(i, el) {
            var $el = $(el);
            if (!registry.isWidget($el)) {
                _.each(widgetMap, function(candidate) {
                    var widget;
                    if ($el.is(candidate[0])) {
                        result.push(candidate[1]($el));
                    }
                });
            }
        });
        return result;
    }

    function makeMessageLists($el, widgets) {
        _.each(widgets, function(widget) {
            if (widget.options.messageList === null) {
                var name =  widget.$node.attr('name') ||
                            widget.$node.attr('data-bind'),
                    $candidate = $el.find('.messagelist[data-for="'+name+'"]');
                if ($candidate.length === 1 && !registry.isWidget($candidate)) {
                    widget.set('messageList', MessageList($candidate));
                }
            }
        });
        return widgets;
    }

    function assignLabels($el, widgets) {
        $el.find('label[data-for]:not([for])').each(function(i, el) {
            var type, $el = $(el),
                split = $el.attr('data-for').split(':'),
                name = split[0],
                value = split[1],
                widget = _.find(widgets, function(w) {
                    return  name === w.$node.attr('name') ||
                            name === w.$node.attr('data-bind');
                });
            if (widget) {
                if (value != null) {
                    type = widget instanceof RadioGroup? 'radio' : 'checkbox';
                    $el.attr('for', widget.$node
                        .find('[type='+type+'][value=' + value + ']')
                        .attr('id'));
                } else {
                    $el.attr('for', widget.id);
                }
            }
        });
        return widgets;
    }

    // returns a list of Widget instances
    return function($el) {
        $el = $($el);
        return assignLabels($el,
                makeMessageLists($el,
                    makeWidgets($el)));
    };
});

