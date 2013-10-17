define([
    'vendor/jquery',
    'vendor/underscore',
    './widget',
    'css!./timeselect/timeselect.css'
], function($, _, Widget) {

    var priv = new function() {
        this._duexgitize = function(num) {
            return (String(num).length==1) ? "0" + num : num;
        };
        this._generate_time_strings = function(hours, minutes, military) {
            var self=this, times = [], pms = [];
            _.each(hours, function(hour) {
                _.each(minutes, function(minute) {
                    var str = self._duexgitize(hour) + ":" + self._duexgitize(minute);
                    times.push((military) ? str : str + ' AM');
                    if(!military) {
                            pms.push(str + ' PM');
                    }
                });
            });
            return (military) ? times : times.concat(pms);
        };
        this._generate_time_options = function (increment, military) {
            var hours = [12].concat(_.range(1, 12)),
                minutes = _.range(0, 59, increment),
                times = this._generate_time_strings(hours, minutes, military),
                str = "";
            _.each(times, function(time) {
                str+=("<li>" + time + "</li>");
            });
            return "<ol class=time-options>" + str + "</ol>";
        };
        this._tokenize = function(timeString, military) {
            var hourMin = (timeString && timeString.length && timeString.indexOf(':')!=-1) ? timeString.split(':') : null,
                hours = (hourMin) ? hourMin[0] : null,
                minutes = (hourMin) ? hourMin[1].split(' ')[0] : null,
                meridian = (!military && timeString.indexOf(' ')!=-1) ? timeString.split(' ')[1]: null;
            return [hours, minutes, meridian];
        };
        this._parse_time = function(timeString, military) {
            var timeTokens = this._tokenize(timeString, military);
            return {hours: Number(timeTokens[0]), minutes: Number(timeTokens[1]), meridian: timeTokens[2]};
        };
        this._validate = function(timeString, military) {
            var time = this._parse_time(timeString),
                maxHours = (military) ? 24 : 12,
                strLen = (military) ? 'hh:mm'.length : 'hh:mm MM'.length;
            return (timeString.length === strLen &&
                    (!isNaN(time.hours) && time.hours > 0 && time.hours < maxHours) &&                         // Hours
                    (!isNaN(time.minutes) && time.minutes >= 0 && time.minutes < 60) &&                        // Minutes
                    (military) ? (time.meridian===null) : (time.meridian === 'PM' || time.meridian === 'AM')); // Meridian
        };
        /* user interaction fns */
        this._add_hover_behavior = function(self, elements) {
            _.each(elements, function(element) {
                var $el = $(element);
                $el.hover( function() {
                    $el.css('background', self.options.hoverColor);
                }, function() {
                    $el.css('background','white');
                });
            });
            self.$node.find('.time-options').css('cursor', 'pointer');
        };
        this._calc_time_element_height = function($timeElements) {
            return $timeElements.eq(1).position().top - $timeElements.eq(0).position().top;
        };
        this._set_time_elements_to_current_time = function($timeSelector, $timeElements, minuteInc, timeElementHeight) {
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

    var TimeSelect = Widget.extend({
        defaults: {
            format: 'hh:mm A',
            hoverColor: '#ccc',
            minuteIncrement: 30
        },
        nodeTemplate: '<div class=time-select><input class=time-input type=text></input><div class="time-drop"></div></div>',
        
        create: function() {
            this._super.apply(this,arguments);
            var self = this,
                $input = self.$node.find('.time-input'),
                $timeDrop = self.$node.find('.time-drop').html( priv._generate_time_options(self.options.minuteIncrement) ),
                $timeOptions = $timeDrop.find('.time-options'),
                $timeElements = $timeOptions.find('li'),
                show_times = function() {
                    $timeOptions.show();
                    priv._set_time_elements_to_current_time( $timeDrop, $timeElements, self.options.minuteIncrement,
                                                            priv._calc_time_element_height( $timeElements ));
                };

            $timeOptions.hide();
            priv._add_hover_behavior(self, $timeOptions.children());

            $input.on('focus click', show_times);
            $input.on('keypress', function(evt) {
                if(Widget.identifyKeyEvent(evt)==='tab'){
                    $timeOptions.hide();
                }
            });
            $timeOptions.on('click', function(evt) {
                $input.val(evt.target.innerHTML);
                $timeOptions.hide();
            });
            self.onPageClick(function() {
                $timeOptions.hide();
            });
        },
        getValue: function() {
           return priv._parse_time(this.$node.find('.time-input').val(), false);
        }
    });

    return function(defaults, withPrivate) {
        return (withPrivate) ? _.extend(TimeSelect.extend(defaults)(), priv) : TimeSelect.extend(defaults)();
    };
});
