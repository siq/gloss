/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'vendor/underscore',
    './../ascollectionviewable',
    './../asinfinitescrollable',
    './../../views/simpleview',
    './../../widgets/user_display/spinner',
    'mesh/tests/mockedexample',
], function($, _, asCollectionViewable, asInfiniteScrollable, SimpleView, Spinner,
    Example) {

    // this is our base list that renders our list items utilizing the asinfinitescrollable mixin
    // notice that the spinner is added here and not as part of the mixin
    // this allows more composable use
    var List = SimpleView.extend({
            defaults: {
                rowTmpl: _.template('<div><%= text_field %></div>'),
            },
            template: '<div class=list style="height:300px; border:1px solid; overflow:auto;"></div>',
            _initWidgets: function() {
                var self = this;
                this.scrollLoadSpinner = Spinner(null, {
                    opts: {
                        lines: 10, // The number of lines to draw
                        length: 5, // The length of each line
                        width: 3, // The line thickness
                        radius: 5, // The radius of the inner circle
                    }
                });
                this.get('collection').on('load', function() {
                    self.scrollLoadSpinner.disable();
                    // this little piece of magic stop the horizontal scroll bar
                    // from showing up when the spinner is showing
                    self.scrollLoadSpinner.$node.css('position', 'relative');
                    $(self.scrollLoadSpinner.spinner.el).css('position', 'absolute');
                });
                this.get('collection').on('update load-error', function() {
                    self.scrollLoadSpinner.enable();
                });
                return this._super.apply(this, arguments);
            },
            render: function(models) {
                models = models || this.get('models');
                var self = this,
                    itemEls = _.map(models, function(m) {
                        var rowTmpl = self.get('rowTmpl'),
                            el = rowTmpl(m);
                        return $(el);
                    });
                if (this.scrollLoadSpinner) {
                    this.scrollLoadSpinner.set('target', this.$el.children().last()[0]);
                    itemEls.push(this.scrollLoadSpinner.$node);
                }
                this._super.apply(this, arguments);
                this.$el.html(itemEls);
                return this;
            },
            update: function(changed) {
                this._super.apply(this, arguments);
                if (changed.models) {
                    this.render();
                }
                return this;
            }
        });
    asCollectionViewable.call(List.prototype);
    asInfiniteScrollable.call(List.prototype);

    var setup = function(options) {
            var list,
                collection,
                dfd = $.Deferred();

            options = $.extend(true, {
                appendTo: '#qunit-fixture',
                params: {},
                delay: null,
                fail: false,
                listOptions: {},
            }, options);

            Example.mockDelay(options.delay)
                .mockFailure(options.fail)
                .models.clear();

            collection = Example.collection(options.params);
            list = window.list = List($.extend({
                    collection: collection,
                }, options.listOptions));

            if (options.appendTo) {
                list.appendTo(options.appendTo);
            }

            collection.load().then(function() {
                $(function() {
                    dfd.resolve(list, options);
                });
            });

            return dfd;
        };

    asyncTest('setup and instantiation works', function() {
        setup({
            appendTo: 'body',
        }).then(function(list, options) {
            ok(list);
            start();
        }, function() {
            ok(false, 'failed setup');
            start();
        });
    });
    asyncTest('loading via collection with limit works', function() {
        setup({
            appendTo: 'body',
            // we add a load delay so we can see the spinner
            delay: 300,
            params: {limit: 50},
        }).then(function(list, options) {
            ok(list);
            start();
        }, function() {
            ok(false, 'failed setup');
            start();
        });
    });

    start();

});

