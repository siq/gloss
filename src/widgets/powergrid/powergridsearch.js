define([
    'vendor/jquery',
    'vendor/underscore',
    './../widgetgroup',
    './../collectionviewable',
    'tmpl!./powergridsearch/powergridsearch.mtpl'
], function($, _, WidgetGroup, CollectionViewable, template) {
    var PowerGridSearch = WidgetGroup.extend({
        defaults: {
            placeholder: 'Enter terms to search...',
            searchParam: 'name__icontains',
            searchButtonText: 'Search',
            populateEmptyNode: true,
            widgetize: true
        },
        nodeTemplate: template,
        create: function() {
            this._super.apply(this, arguments);
            if (!this.getWidget('q').getValue()) {
                this.getWidget('clear').disable();
            }
            // this.on('submit', this.submit);
            // - this is more complicated than it needs to be at this point
            //  we need to be able to put the searcher in a form or a div
            //  we may want to just say this need to be a div
            // - IE doesn't like it to be just a div ... it won't submit with
            // just the enter button.
            //   One way to resolve this is to leave the onSumbit event handler inplace
            // but since we have to catch the enter key for FF we might be able to do
            // that in IE too.
            // - Firefox has issues submitting on the right <input> when it's in a div
            // for example in the third pane of the create-matter modal it will submit
            // on the doclist input which will be the incorrect value for the filter.
            //   To fix this we have to catch the enter key from the input and prevent
            // the default submit and do what we want.

            // - WORKS!!! this works in IE8, FF, Chrome
            var self = this;
            // if (this.$node.is('form')) {
            //     this.on('submit', function(evt) {
            //         evt.preventDefault();
            //         console.log('submit');
            //         self.submit(evt);
            //     });
            // }
            // if (this.$node.is('div')) {
                this.on('click', '[name=search]', function(evt) {
                    evt.preventDefault();
                    console.log('click');
                    self.submit(evt);
                });
                this.on('keydown', '[name=q]', function(evt) {
                    if (evt.which === 13) {
                        evt.preventDefault();
                        self.submit(evt);
                    }
                });
            // }
            this.on('keyup', '[name=q]', this._onKeyup);
            this.on('click', '[name=clear]', this._onClickClear);
            this.update();
        },
        _getPreviousParams: function() {
            return $.extend(true, {}, this.options.collection.query.params);
        },
        _makeQueryParams: function() {
            var p = {query: {}},
                value = this.getWidget('q').getValue().trim(),
                previousParams = this._getPreviousParams(),
                result = {};

            if (value) {
                p.query[this.options.searchParam] = value;
            }

            // to check if the previous params had a query parameter then remove search param from it
            if (previousParams.query && _.has(previousParams.query, this.options.searchParam)) {
                previousParams.query = _.omit(previousParams.query, this.options.searchParam);
            }

            result = $.extend(true, result, previousParams, p);

            // If query parameter is empty then delete it
            result.query = _.isEmpty(result.query) ? null : result.query;
            return result;
        },
        _onClickClear: function() {
            var clear = this.getWidget('clear'),
                q = this.getWidget('q').setValue('');

            if (this._filtered) {
                this.submit();
            }
        },
        _onKeyup: function() {
            var method = this._filtered || this.getWidget('q').getValue()?
                'enable' : 'disable';
            this.getWidget('clear')[method]();
        },
        submit: function(evt) {
            var params, self = this, collection = self.options.collection;
            if (evt) {
                evt.preventDefault();
            }
            if (!collection) {
                return;
            }
            self.propagate('disable');

            params = self._makeQueryParams();
            self._filtered = !!params.query;
            collection.reset(params);
            self.trigger('searchStarted'); // deprecated, use collection event
            collection.trigger('powerGridSearchStarted');

            return collection.load().always(function() {
                self.propagate('enable');
                self.trigger('searchCompleted'); // deprecated, use coll. event
                collection.trigger('powerGridSearchCompleted');

                if (!self.getWidget('q').getValue()) {
                    self.getWidget('clear').disable();
                }
            });
        }
    }, {mixins: [CollectionViewable]});

    return PowerGridSearch;
});
