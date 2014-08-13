/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../checkboxgroup',
    '../form',
    './../../../data/mock',
    './../../../test/api/v1/targetvolume',
    'text!./../../../test/api/v1/test/fixtures/targetvolume.json',
    'mesh/tests/example',
    'mesh/tests/examplefixtures',
    'mesh/tests/mockutils'
], function($, _, CheckBoxGroup, Form, Mock, TargetVolume, targetvolume_json,
    Example, exampleFixtures, mockUtils) {

    var valueMatchesCheckboxes = function(checkboxes, value) {
        _.each(checkboxes, function(cb) {
            var idx = _.indexOf(value, cb.options.value);
            equal(cb.node.checked, idx >= 0);
        });
    };
    
    var BigMock = mockUtils('Example', Example, exampleFixtures);
    Mock(TargetVolume, JSON.parse(targetvolume_json));

    asyncTest('checkbox instantiation from collection', function() {
        var cbg = CheckBoxGroup()
                    .set('collection', TargetVolume.collection())
                    .appendTo('#qunit-fixture');
        setTimeout(function() {
            equal(cbg.$node.find('input[type=checkbox]').length, 6);
            start();
        }, 50);
    });

    test('checkboxgroup instantiation without collection', function() {
        var cbg = window.cbg = CheckBoxGroup(undefined, {
            entries: [
                {name: 'foo bar baz', value: 0},
                {name: 'foo bar biggity iggity bazzle', value: 1}
            ]
        }).appendTo('#qunit-fixture');

        equal(cbg.$node.find('input[type=checkbox]').length, 2);
    });

    asyncTest('setting and getting value of checkboxgroup', function() {
        var cbg = CheckBoxGroup()
                    .set('collection', TargetVolume.collection())
                    .appendTo('#qunit-fixture');
        setTimeout(function() {
            equal(cbg.getValue().length, 0);
            valueMatchesCheckboxes(cbg.checkboxes, cbg.getValue());

            cbg.setValue([1357, 4]);
            ok(_.isEqual(cbg.getValue(), [1357, 4]), 'getValue() should equal [1357, 4]');
            valueMatchesCheckboxes(cbg.checkboxes, cbg.getValue());
            start();
        }, 50);
    });

    test('setting value to all/none', function() {
        var cbg = window.cbg = CheckBoxGroup(undefined, {
            entries: [
                {name: 'foo bar baz', value: 0},
                {name: 'foo bar biggity iggity bazzle', value: 1}
            ]
        }).appendTo('#qunit-fixture');

        cbg.setValue('all');
        deepEqual(cbg.getValue(), [0, 1]);

        cbg.setValue('none');
        deepEqual(cbg.getValue(), []);
    });

    test('checkboxgroup correctly widgetized', function() {
        var $frm = $('<form><div name=my-cbg class=checkboxgroup></div></form>')
                .appendTo('body'),
            form = Form($frm, {widgetize: true});

        ok(form.getWidget('my-cbg'));
    });

    test('default checked option checks all on initialization', function() {
        var cbg = window.cbg = CheckBoxGroup(undefined, {
            checked: true,
            checkall: true,
            entries: [
                {name: 'foo bar baz', value: 0},
                {name: 'foo bar biggity iggity bazzle', value: 1}
            ]
        });

        deepEqual(cbg.getValue(), [0, 1]);
        equal(cbg.$node.find('.checkall').attr('checked'), 'checked', 'checkall checkbox is checked');
    });

    // we only want to run the 'checkbox column' module if we're in a browser
    // where triggering a 'click' event on a checkbox subsequently triggers a
    // 'change' event. since we're lazy and busy, we're just checking for
    // webkit
    if ($.browser.webkit) {
        module('checkall checkbox');

        asyncTest('checkall checks all checkboxes', function() {
            var $checkAll,
                cbg = window.cbg = CheckBoxGroup(undefined, {
                checkall: true,
                entries: [
                    {name: 'foo bar baz', value: 0},
                    {name: 'foo bar biggity iggity bazzle', value: 1}
                ]
            }).appendTo('body');

            $checkAll = cbg.$node.find('.checkall');
            $checkAll.trigger('click');
            setTimeout(function() {
                deepEqual(cbg.getValue(), [0, 1]);
                start();
            }, 15);
        });
    }

    test('performance check', function() {
        var start, cbg,
            limit = 1000,
            collection = BigMock.collection({limit: limit}),
            $perfButton = $("<button class='perf-button'>performance check</button>");

        $perfButton.appendTo('body');
        $('body').on('click', '.perf-button', function() {
            $perfButton.text('working...');
            cbg = CheckBoxGroup(undefined, {
                translate: function(item) {
                    return {value: item.id, name: item.text_field};
                }
            }).appendTo('body');

            start = new Date();
            cbg.set('collection', collection);
        });
        collection.on('update', function() {
            var end = new Date(),
                timeLapse = (end-start)/1000;
            
            console.log('time:', timeLapse);
            $('.perf-button').after('<b>'+limit+' object in '+timeLapse+' seconds</b> ');
            $perfButton.text('performance check');
        });
        ok(true);
    });

    module('checkboxgroup with icon')
    test('checkboxgroup instantiation with icon configuration', function() {
        var iconCbg = window.iconCbg = CheckBoxGroup(undefined, {
                icon: '<span class="icon eye" title="View All">S</span>',
                entries: [{
                    name: 'Value-1',
                    value: 0
                }, {
                    name: 'value-2',
                    value: 1
                }]
            }),
            icons;
        iconCbg.$node.appendTo($('body'));
        icons = iconCbg.$node.find('span.icon');
        ok(icons.length === 2);
        $.each(icons, function(i, icon) {
            ok($(icon).hasClass('eye'));
        });
    });

    asyncTest('ensure that clicking on the icon triggers the right handlers',function(){
        var clicked = false;
        iconCbg.on('click','span.icon.eye',function(){
            if(clicked) return;
            clicked = true;
            ok(true);
            start();
        });

        setTimeout(function(){
            $(iconCbg.$node.find('span.icon.eye')[0]).click();
        },800);
    });

    start();
});
