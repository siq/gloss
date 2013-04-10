/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual */
define([
    'vendor/jquery',
    'tmpl!./template.mtpl',
    'tmpl!./xss_tmpl.mtpl'
], function($, tmpl, xss_tmpl) {
    test('template plugin compiled', function() {
        ok(tmpl);
        var data = {
                foo: {bar: 'baz'},
                list: ['uno', 'dos', 'tres']
            },
            $html = $(tmpl(data));
        equal($html.find('li').length, 3);
        equal($html.find('span:first').text(), data.foo.bar);
        ok(/uno.*dos.*tres/.test($html.find('ul').text()));
    });

    // define some globals to check for xss execution
    window.xssCount = 0;
    window.increment = function() {
            xssCount++;
        };
    test('template escapes html to prevent xss', function() {
        xssCount = 0;
        var badGuy = "<script>increment()</script>",
            data = {
                scripty: badGuy
            },
            $html = $(xss_tmpl(data));
        // append to DOM so script will execute
        $html.appendTo('body');
        equal(xssCount, 0, 'template is excaping html');
    });
    test('template escape can be overridden', function() {
        xssCount = 0;
        var goodGuy = "<script>increment()</script>",
            data = {
                noscripty: goodGuy
            },
            $html = $(xss_tmpl(data));
        // append to DOM so script will execute
        $html.appendTo('body');
        equal(xssCount, 1, 'template is excaping html');
    });
    start();
});

