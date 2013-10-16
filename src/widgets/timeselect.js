define([
    './widget',
    './simpleview',
    './timeselect/private',
    'css!./timeselect/timeselect.css'
], function(Widget, SimpleView, priv) {
    return SimpleView.extend({
        defaults: {
            format: 'hh:mm A',
            hoverColor: '#ccc',
            minuteIncrement: 30
        },
        template: '<div class=time-select><input class=time-input type=text></input><div class="time-drop"></div></div>',
        
        _initWidgets: function() {
            var self = this;
            this._super.apply(this, arguments);
            self.timeSelector = this.$el.find('.time-drop').html( priv.generate_time_options(self.get('minuteIncrement')) );
            self.$timeElements = self.timeSelector.find('.time-options li');

            self.timeSelector.find('.time-options').addClass('hidden');
            priv.add_hover_behavior(self, this.$el.find('.time-options').children());
        },

        _bindEvents: function() {
            var self = this,
            $input = self.$el.find('.time-input');
            self._super.apply(this,arguments),

            $input.on('focus click', function(){
                self.timeSelector.find('.time-options').removeClass('hidden');
                priv.set_time_elements_to_current_time(self.timeSelector,
                                                       self.$timeElements,
                                                       self.get('minuteIncrement'),
                                                       priv.calc_time_element_height(self.$timeElements));
            });
            self.timeSelector.find('.time-options').on('click', function(evt) {
                $input.val(evt.target.innerHTML);
                self.timeSelector.find('.time-options').toggleClass('hidden');
            });
            $input.on('keydown', function(evt) {
                if (Widget.identifyKeyEvent(evt) === 'tab') {
                    self.timeSelector.find('.time-options').addClass('hidden');
                }
            });
        },
        getValue: function() {
           return priv.parse_time(this.$el.find('.time-input').val(), false);
        }
    });
});
