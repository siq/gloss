define([
], function() {
    return function() {

        var _bindKeyboardNavigation = function() {
            var self = this;
            if (!this.get('keyboardNavigation')) {
                return;
            }
            this.$el.bind('keyup', 'tbody tr', function(evt) {
                var selectModel, selectIndex,
                    selected = self.selected(),
                    models = self.get('models');

                if (!selected || !self.$rowInnerWrapper.is(':visible')) {
                    return;
                }
                if (evt.which === 13) {      //  - enter key
                    self._trFromModel(selected).trigger('dblclick');
                    console.log('trigger');
                    return;
                } else if (evt.which === 38) {             //  - up arrow
                    selectIndex = models.indexOf(selected) - 1;
                } else if (evt.which === 40) {      //  - down arrow
                    selectIndex = models.indexOf(selected) + 1;
                }
                selectModel = models[selectIndex];
                if (selectModel) {
                    self.select(selectModel);
                }
            });
            // this.el.onkeyup = function() {
            //     console.log('onkeyup');
            // };
        };

        if(!this.afterInit) {
            this.afterInit = [];
        }
        this.afterInit.push(_bindKeyboardNavigation);
    };
});
