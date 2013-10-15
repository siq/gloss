define([
    './simpleview',
    './timeselect/private',
    'css!./timeselect/timeselect.css'
], function(SimpleView, p) {

    var TimeSelect = SimpleView.extend({
        defaults: {
            format: 'hh:mm A',
            hoverColor: '#ccc',
            minuteIncrement: 30
        },
        template: '<div class=time-select><input class=time-input type=text></input><div class="time-drop"></div></div>',

        _initWidgets: function() {
            var self = this;
            this._super.apply(this, arguments);
            self.timeSelector = this.$el.find('.time-drop').html( p.generate_time_options(self.get('minuteIncrement')) );
            self.$timeElements = self.timeSelector.find('.time-options li');

            self.timeSelector.find('.time-options').addClass('hidden');
            p.add_hover_behavior(self, this.$el.find('.time-options').children());
        },

        _bindEvents: function() {
            var self = this,
            $input = self.$el.find('.time-input');
            self._super.apply(this,arguments),

            $input.click(function(){
                self.timeSelector.find('.time-options').toggleClass('hidden');
                p.set_time_elements_to_current_time(self.timeSelector,
                                                    self.$timeElements,
                                                    self.get('minuteIncrement'),
                                                    p.calc_time_element_height(self.$timeElements));
            });
            self.timeSelector.find('.time-options').on('click', function(evt) {
                $input.val(evt.target.innerHTML);
                self.timeSelector.find('.time-options').toggleClass('hidden');
            });
            return self;
        },
        getValue: function() {
           return p.read_time(this.$el.find('.time-input'));
        }
    });
    return TimeSelect;
});
