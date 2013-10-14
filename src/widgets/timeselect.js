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
    var TimeSelect = SimpleView.extend({
        defaults: {
            format: 'hh:mm A',
           hoverColor: '#ccc',
           minuteIncrement: 30
        },
        template: '<div class=time-select><input class=time-input type=text></input><div class="time-drop"></div></div>',
        _initWidgets: function() {
            this._super.apply(this, arguments);
            var self = this,
                options = generate_time_options(this.get('minuteIncrement'));

            self.timeSelector = this.$el.find('.time-drop').html( options );
            self.timeSelector.find('.time-options').hide();

            self.$el.find('.time-input').click(function(){
                self.timeSelector.find('.time-options').show();

                /* The following is to calculate how far to scroll the pseudo select box to center on 'now'*/
                var zeroTop = self.timeSelector.find('.time-options li').eq(0).position().top,
                    optionHeight = self.timeSelector.find('.time-options li').eq(1).position().top -
                        self.timeSelector.find('.time-options li').eq(0).position().top;

                // need to get the current time's index within the time selection options
                var multiplier = 60 / Number(self.get('minuteIncrement'));
                var hourCount = (new Date).getHours();

                self.timeSelector.find('.time-options').animate({scrollTop: optionHeight*(multiplier*hourCount)});


            });
            /* This should be in bind events */
            _.each(this.$el.find('.time-options').children(), function(el) {
                var $el = $(el);
                $el.hover( function() {
                $el.css('background', self.options.hoverColor);
                }, function() {
                    $el.css('background','white');
                });
                $el.click(function() {
                    self.$el.find('.time-input').val($(this).html());
                    self.timeSelector.find('.time-options').hide();
                });
            });
            self.$el.find('.time-options').css('cursor', 'pointer');
        },

        _bindEvents: function() {
            var self = this;
            self._super.apply(this,arguments);
            self.on('click', function() {
                self.timeSelector.show();
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
