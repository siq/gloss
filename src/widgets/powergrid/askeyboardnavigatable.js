define([
    'vendor/underscore'
], function(_) {
    return function() {

        var _bindKeyboardNavigation = function() {
            var self = this;
            if (!this.get('keyboardNavigation')) {
                return;
            }
            //  - We don't want the page to scroll when were trying to navigate
            //  - with the keyboard so we're going to prevent that here.
            var keys = [38,40];
            this.$el.bind('keydown', 'tbody tr', function(evt) {
                var key = evt.which;
                if(_.contains(keys, key)) {
                    evt.preventDefault();
                    return false;
                }
                return true;
            });
            this.$el.bind('keyup', 'tbody tr', function(evt) {
                var selectModel, selectIndex,
                    selected = self.selected(),
                    models = self.get('models');

                if (!selected || !self.$rowInnerWrapper.is(':visible')) {
                    return;
                }
                if (evt.which === 13) {      //  - enter key
                    self._trFromModel(selected).trigger('dblclick');
                    return;
                } else if (evt.which === 38) {             //  - up arrow
                    selectIndex = models.indexOf(selected) - 1;
                } else if (evt.which === 40) {      //  - down arrow
                    selectIndex = models.indexOf(selected) + 1;
                }
                selectedModel = models[selectIndex] || selected;
                self.select(selectedModel);
                self._focusModel(selectedModel);
            });
        };
        var _rerenderExtend = function () {
            var self = this, _rerender = this._rerender;
            if (!this.get('keyboardNavigation')) {
                return;
            }
            this._rerender = function() {
                var selected = self.selected();
                _rerender.call(self);
                if (selected) {
                    self._focusModel(selected);
                }
            };
        };
        this._focusModel = function(model) {
            var models = this.get('models'),
                headerHeight = this.$el.find('.header-wrapper').height(),
                trHeight = this.$rowInnerWrapper.find('tr').first().height(),
                scrollTop = this.$rowInnerWrapper.scrollTop(),
                scrollTo;

            model = model || _.first(models);

            if (_.last(models) === model) {
                // - this is the last row so just scroll to the bottom
                scrollTo = this.$rowInnerWrapper.find('.rows').height();
            } else if (_.first(models) === model) {
                // - this is the first row so just scroll to the top
                scrollTo = 0;
            } else {
                var top = this._trFromModel(model).position().top,
                    gridHeight = this.$rowInnerWrapper.height();
                if (top < trHeight) { // - row is above the grid view
                    scrollTo = scrollTop - headerHeight + top;
                } else if (top > gridHeight) { //  - row is below the grid view
                    scrollTo = scrollTop - gridHeight + top;
                }
            }
            if (typeof scrollTo === 'number') {
                this.$rowInnerWrapper.scrollTop(scrollTo);
            }
        };

        if(!this.afterInit) {
            this.afterInit = [];
        }
        this.afterInit.push(_bindKeyboardNavigation);
        this.afterInit.push(_rerenderExtend);
    };
});
