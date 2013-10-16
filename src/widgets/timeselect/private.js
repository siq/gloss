define([
    'vendor/jquery',
    'vendor/underscore'
], function($, _) {
    return new function() {
        this.duexgitize = function(num) {
            return (String(num).length==1) ? "0" + num : num;
        };
        this.generate_time_strings = function(hours, minutes, military) {
            var self=this, times = [], pms = [];
                _.each(hours, function(hour) {
                    _.each(minutes, function(minute) {
                        var str = self.duexgitize(hour) + ":" + self.duexgitize(minute);
                        times.push((military) ? str : str + ' AM');
                        if(!military) {
                            pms.push(str + ' PM');
                        }
                    });
                });
            return (military) ? times : times.concat(pms);
        };
        this.generate_time_options = function (increment, military) {
            var hours = [12].concat(_.range(1, 12)),
                minutes = _.range(0, 59, increment),
                times = this.generate_time_strings(hours, minutes, military),
                str = "";
            _.each(times, function(time) {
                str+=("<li>" + time + "</li>");
            });
            return "<ol class=time-options>" + str + "</ol>";
        };
        this.tokenize = function(timeString, military) {
            var hourMin = (timeString && timeString.length && timeString.indexOf(':')!=-1) ? timeString.split(':') : null,
                hours = (hourMin) ? hourMin[0] : null,
                minutes = (hourMin) ? hourMin[1].split(' ')[0] : null,
                meridian = (!military && timeString.indexOf(' ')!=-1) ? timeString.split(' ')[1]: null;
            return [hours, minutes, meridian];
        };
        this.parse_time = function(timeString, military) {
            var timeTokens = this.tokenize(timeString, military);
            return {hours: Number(timeTokens[0]), minutes: Number(timeTokens[1]), meridian: timeTokens[2]};
        };
        this.validate = function(timeString, military) {
            var time = this.parse_time(timeString),
                maxHours = (military) ? 24 : 12,
                strLen = (military) ? 'hh:mm'.length : 'hh:mm MM'.length;
            return (timeString.length === strLen &&
                    (!isNaN(time.hours) && time.hours > 0 && time.hours < maxHours) &&                         // Hours
                    (!isNaN(time.minutes) && time.minutes >= 0 && time.minutes < 60) &&                        // Minutes
                    (military) ? (time.meridian===null) : (time.meridian === 'PM' || time.meridian === 'AM')); // Meridian
        };
        /* user interaction fns */
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
        this.set_time_elements_to_current_time = function($timeSelector, $timeElements, minuteInc, timeElementHeight) {
            var now = new Date(),
                zeroTop = $timeElements.eq(0).position().top,
                multiplier = 60 / Number(minuteInc),
                hourCount = now.getHours(),
                minuteCount = now.getMinutes();
            $timeSelector.find('.time-options').animate({
                scrollTop: timeElementHeight*(multiplier*hourCount),
                duration: 200
            });
        };
    };
});
