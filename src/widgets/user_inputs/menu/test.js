/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
define([
    'vendor/jquery',
    './../menu'
], function($, Menu) {

    test('Menu Check', function(){
        var menu = Menu($('<div></div>'), {
                entries: [
                    {content: "Directory",  value: 'directory'},
                    {content: "Directory0", value: 'directory0'},
                    {content: "Directory1", value: 'directory1'},
                    {content: "Directory2", value: 'directory2'}
                ]
            }).appendTo($('body')),
            options = menu.options;

        menu.show();

        ok(true, "true");
        ok(options.entries.length === 4, "number of entries");
    });

    test('Menu handlers', function(){
        var menu = Menu($('<div></div>'), {
                entries: [
                    {content: "Directory",  value: 'directory'}
                ]
            }).appendTo('#qunit-fixture'),
            options = menu.options,
            selected = 0;

        menu.show();
        options.entries[0].onselect = function() {
            selected = 1;
        };
        menu.select(options.entries[0]);
        ok(selected === 1);
    });

    module('disabled menu item');
    test('can not be selected', function(){
        var menu = Menu($('<div></div>'), {
                entries: [
                    {content: "Directory",  value: 'directory'},
                    {content: "Directory0", value: 'directory0'},
                    {content: "Directory1", value: 'directory1', disabled: true},
                    {content: "Directory2", value: 'directory2'}
                ]
            }).appendTo('#qunit-fixture'),
            options = menu.options,
            selected = 0;

        menu.show();
        options.entries[2].onselect = function() {
            selected = 1;
        };
        menu.select(options.entries[2]);
        ok(selected === 0);
    });

    test('disabled selection closes menu with no selection update', function(){
        var menu = Menu($('<div></div>'), {
                entries: [
                    {content: "Directory",  value: 'directory'},
                    {content: "Directory0", value: 'directory0'},
                    {content: "Directory1", value: 'directory1', disabled: true},
                    {content: "Directory2", value: 'directory2'}
                ]
            }).appendTo('#qunit-fixture'),
            options = menu.options,
            selected = 0;

        menu.show();
        menu.select(options.entries[2]);
        ok(!menu.isShown(), 'menu should be hidden');
    });

    test('disabled attr can be added to element at runtime', function(){
        var menu = Menu($('<div></div>'), {
                entries: [
                    {content: "Directory",  value: 'directory'},
                    {content: "Directory0", value: 'directory0'},
                    {content: "Directory1", value: 'directory1'},
                    {content: "Directory2", value: 'directory2'}
                ]
            }).appendTo('#qunit-fixture'),
            options = menu.options,
            $entry,
            selected = 0;

        menu.show();
        // add `disabled` attr to second entry
        $entry = menu.$entries.find('li[value=' + options.entries[1].value + ']');
        $entry.attr('disabled', true);
        options.entries[1].onselect = function() {
            selected = 1;
        };
        menu.select(options.entries[1]);
        ok(selected === 0);
    });

    start();
});
