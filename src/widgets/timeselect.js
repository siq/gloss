define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './../widgets/selectbox',
    './simpleview',
    'css!./timeselect/timeselect.css'
], function($, _, moment, SelectBox, SimpleView) {

    var duexgitize_hours = function(num) {
        return (String(num).length==1) ? "0" + num : num;
    };

    var duexgitize_minutes = function(num) {
        return (String(num).length==1) ? num + "0" : num;
    };

    var generate_time_strings = function(hours, minutes) {
        var ams = [],
            pms = [];
        _.each(hours, function(hour) {
            _.each(minutes, function(minute) {
                var str = duexgitize_hours(hour) + ":" + duexgitize_minutes(minute);
                ams.push(str + " AM");
                pms.push(str + " PM");
            });
        });
        return ams.concat(pms);
    };

    var generate_time_options = function (increment) {
        var hours = [12].concat(_.range(1, 12)),
            minutes = _.range(0, 59, increment);

        var times = generate_time_strings(hours, minutes),
            str = "";
        _.each(times, function(time) {
            str+=("<li>" + time + "</li>");
        });
        return "<ol class=time-options>" + str + "</ol>";
    };

    var add_hover_behavior = function(self, elements) {
        _.each(elements, function(element) {
            var $el = $(element);
            $el.hover( function() {
                $el.css('background', self.options.hoverColor);
            }, function() {
                $el.css('background','white');
            });
	});
        self.$el.find('.time-options').css('cursor', 'pointer');
    };

    var calc_time_element_height = function($timeElements) {
        return $timeElements.eq(1).position().top - $timeElements.eq(0).position().top;
    };

    var set_time_elements_to_current_time = function($timeSelector, $timeElements, minuteIncrement, timeElementHeight) {
        var now = new Date(),
            zeroTop = $timeElements.eq(0).position().top,
            multiplier = 60 / Number(minuteIncrement),//self.get('minuteIncrement')),
            hourCount = now.getHours(),
            minuteCount = now.getMinutes();
        $timeSelector.find('.time-options').animate({
            scrollTop: timeElementHeight*(multiplier*hourCount),
            duration: 200
        });
    };
    var validate_12_hour = function(timeString) {
    };
    var validate_24_hour = function(timeString) {
    };
    // Add validation
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
            self.timeSelector = this.$el.find('.time-drop').html( generate_time_options(self.get('minuteIncrement')) );
            self.$timeElements = self.timeSelector.find('.time-options li');

            self.timeSelector.find('.time-options').addClass('hidden');
            add_hover_behavior(self, this.$el.find('.time-options').children());
        },

        _bindEvents: function() {
            var self = this,
		$input = self.$el.find('.time-input');
            self._super.apply(this,arguments),

            $input.click(function(){
                self.timeSelector.find('.time-options').toggleClass('hidden');
                set_time_elements_to_current_time(self.timeSelector,
                                                  self.$timeElements,
                                                  self.get('minuteIncrement'),
                                                  calc_time_element_height(self.$timeElements));
            });
        self.timeSelector.find('.time-options').on('click', function(evt) {
                $input.val(evt.target.innerHTML);
                self.timeSelector.find('.time-options').toggleClass('hidden');
        });
            self.timeSelector.on('change', function() {
                self.$el.find('.time-input').val(self.timeSelector.getValue());
                self.timeSelector.hide();
            });
            return self;
        },
        init: function() {
            this._super.apply(this, arguments);
        }

        // get value
    });
    return TimeSelect;
});
