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

        if(!this.afterInit) {
            this.afterInit = [];
        }
        this.afterInit.push(_bindKeyboardNavigation);
    };
});
