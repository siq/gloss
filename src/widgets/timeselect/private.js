define([
    'vendor/jquery'
], function($, _) {
    return new function() {
        this.duexgitize_hours = function(num) {
            return (String(num).length==1) ? "0" + num : num;
        };
        this.duexgitize_minutes = function(num) {
            return (String(num).length==1) ? num + "0" : num;
        };
        this.generate_time_strings = function(hours, minutes) {
        var ams = [],
            pms = [];
            _.each(hours, function(hour) {
                _.each(minutes, function(minute) {
                    var str = this.duexgitize_hours(hour) + ":" + this.duexgitize_minutes(minute);
                    ams.push(str + " AM");
                    pms.push(str + " PM");
                });
            });
            return ams.concat(pms);
        };
        this.generate_time_options = function (increment) {
            var hours = [12].concat(_.range(1, 12)),
                minutes = _.range(0, 59, increment);
            
            var times = this.generate_time_strings(hours, minutes),
                str = "";
            _.each(times, function(time) {
                str+=("<li>" + time + "</li>");
            });
            return "<ol class=time-options>" + str + "</ol>";
        };
        this.add_hover_behavior = function(self, elements) {
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
        this.calc_time_element_height = function($timeElements) {
            return $timeElements.eq(1).position().top - $timeElements.eq(0).position().top;
        };
        this.set_time_elements_to_current_time = function($timeSelector, $timeElements, minuteIncrement, timeElementHeight) {
            var now = new Date(),
                zeroTop = $timeElements.eq(0).position().top,
                multiplier = 60 / Number(minuteIncrement),
                hourCount = now.getHours(),
                minuteCount = now.getMinutes();
            $timeSelector.find('.time-options').animate({
                scrollTop: timeElementHeight*(multiplier*hourCount),
                duration: 200
            });
        };
        this.read_time = function(timeString) {
            var hours = timeString.split(':')[0],
                minutes = timeString.split(':')[1],
                meridian = timeString.split(' ')[1];
            return {hours: hours, minutes: minutes, meridian: meridian};
        };
        this.validate_12_hour = function(timeString) {
            var valid_hours = function(hours) {
                var h = parseInt(hours);
                return(!isNaN(h) && h > 0 && h < 13);
            };
            var valid_minutes = function(minutes) {
                var m = parseInt(minutes);
                return(!isNaN(m) && m >= 0 && m < 60);
            };
            var valid_meridian = function(meridian) {
                return (meridian === 'PM' || meridian === 'AM');
            };
            var time = read_time(timeString);
            
            return (timeString.length === 'hh:mm AA'.length &&
                    valid_hours(time.hours) &&
                    valid_minutes(time.minutes) &&
                    valid_meridian(time.meridian));
        };
        
        var validate_24_hour = function(timeString) {
            // To implement
        };
    };
});
