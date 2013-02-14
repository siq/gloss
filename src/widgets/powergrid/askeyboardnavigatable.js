define([
    'vendor/underscore'
], function(_) {
    return function() {

        // var self = this;
        // _.wrap(this.init, function(init) {
        //     if (!self.get('keyboardNavigation')) {
        //         return;
        //     }
        //     self.$el.bind('keyup', 'tbody tr', function(evt) {
        //         var selectModel, selectIndex,
        //             selected = self.selected(),
        //             models = self.get('models');

        //         if (!selected || !self.$rowInnerWrapper.is(':visible')) {
        //             return;
        //         }
        //         if (evt.which === 13) {      //  - enter key
        //             self._trFromModel(selected).trigger('dblclick');
        //             console.log('trigger');
        //             return;
        //         } else if (evt.which === 38) {             //  - up arrow
        //             selectIndex = models.indexOf(selected) - 1;
        //         } else if (evt.which === 40) {      //  - down arrow
        //             selectIndex = models.indexOf(selected) + 1;
        //         }
        //         selectModel = models[selectIndex];
        //         if (selectModel) {
        //             self.select(selectModel);
        //         }
        //     });
        // });
        var _bindKeyboardNavigation = function() {
            var self = this;
            if (!this.get('keyboardNavigation')) {
                return;
            }
            this.$el.bind('keyup', 'tbody tr', function(evt) {
                var selectModel, selectIndex,
                    selected = self.selected(),
                    models = self.get('models'),
                    scrollTop = 0;

                if (!selected || !self.$rowInnerWrapper.is(':visible')) {
                    return;
                }
                if (evt.which === 13) {      //  - enter key
                    self._trFromModel(selected).trigger('dblclick');
                    console.log('trigger');
                    return;
                } else if (evt.which === 38) {             //  - up arrow
                    selectIndex = models.indexOf(selected) - 1;
                    scrollTop = self.$rowInnerWrapper.scrollTop() -
                                    self.$rowInnerWrapper.find('tr').first().height();
                } else if (evt.which === 40) {      //  - down arrow
                    selectIndex = models.indexOf(selected) + 1;
                    scrollTop = self.$rowInnerWrapper.scrollTop() +
                                    self.$rowInnerWrapper.find('tr').first().height();
                }
                selectModel = models[selectIndex];
                if (selectModel) {
                    self.select(selectModel);
                    self.$rowInnerWrapper.scrollTop(scrollTop);
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
