/*global test, asyncTest, ok, equal, deepEqual, start, module, notEqual */
define([
    'vendor/underscore',
    './../sort'
], function(_, sort) {

    test('basic sort', function() {
        var stuff = ["Banana", "Orange", "Apple", "Mango"],
            correctOrder = ["Apple", "Banana", "Mango", "Orange"],
            sorted = stuff.sort(function(a, b) {
                return sort.userFriendly(a, b);
            });
        ok(_.isEqual(sorted, correctOrder));
    });
    test('natural alphabetical sort', function() {
        var stuff = ["mango", "Banana", "apple", "pineapple", "Orange", "Apple", "Mango"],
            correctOrder = ["apple", "Apple", "Banana", "mango", "Mango", "Orange", "pineapple"],
            sorted = stuff.sort(function(a, b) {
                return sort.userFriendly(a, b);
            });
        ok(_.isEqual(sorted, correctOrder));
    });
    test('Chinese sort', function() {
        var stuff = ["通€㐀ᠠꀇ༐بة㊣郂", "测试", "今天", "你好吗"],
            correctOrder = ["今天", "你好吗", "测试", "通€㐀ᠠꀇ༐بة㊣郂"],
            sorted = stuff.sort(function(a, b) {
                return sort.userFriendly(a, b);
            });
        ok(_.isEqual(sorted, correctOrder));
    });
    test('Japanese sort', function() {
        // Banana, Orange, Apple, Mango
        var stuff = ["バナナ", "オレンジ", "アップル", "マンゴー"],
            correctOrder = ["アップル", "オレンジ", "バナナ", "マンゴー"],
            sorted = stuff.sort(function(a, b) {
                return sort.userFriendly(a, b);
            });
        ok(_.isEqual(sorted, correctOrder));
    });

    start();
});
