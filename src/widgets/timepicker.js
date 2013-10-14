define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './widget',
    './simpleview',
    './basemenu',
    './textbox',
    './timepicker/accessors',
    'tmpl!./timepicker/timepicker.mtpl'
], function($, _, moment, Widget, SimpleView, BaseMenu, TextBox, accessors, template) {

    var duexgitize_hours = function(num) {
        return (String(num).length==1) ? "0" + num : num;
    };
    var duexgitize_minutes = function(num) {
        return (String(num).length==1) ? num + "0" : num;
    };

    var generate_options = function (increment) {
        var hours = [12].concat(_.range(1, 12)),
            minutes = _.range(0, 59, increment),
            ams = [],
            pms = [];
        _.each(hours, function(hour) {
            _.each(minutes, function(minute) {
                var str = duexgitize_hours(hour) + ":" + duexgitize_minutes(minute);
                ams.push(str + " AM");
                pms.push(str + " PM");
            });
        });
        return _.map(ams.concat(pms), function(time) {
            return "<option>" + time + "</option>";
        });
    };
    var default_time_selection = function() {
        var now = new Date();
    };    var update_time_input = function() {

    };
    var TimePicker = SimpleView.extend({
        defaults: {
            format: 'hh:mm A'
        },
        template:template,
        tab_handler: function(self, evt, shiftIsPressed) {
            var $el = self.input.$node,
                pos = $el.cursor();
            if((shiftIsPressed && pos>="00:".length) ||
               (!shiftIsPressed && pos < "00:00 ".length) ) {
                evt.preventDefault();
            }
            $el.coerce_selection((shiftIsPressed) ? pos-3 : pos+3);
        },
        arrow_handler: function(self, evt, func) {
            evt.preventDefault();
            var $el = self.input.$node,
                pos = $el.cursor(),
                time = $el.time(),
                duexgitize = function(num) {
                    return (String(num).length==1) ? "0" + num : num;
                };
            $el.time( ( $el.is_on("hours") ) ? duexgitize(Math.abs(func(Number(time.hours)%12))) : duexgitize(time.hours),
                        ( $el.is_on("minutes") ) ? duexgitize(func(Number(time.minutes))%60) : duexgitize(time.minutes),
                        ( $el.is_on("meridian") ) ? ((time.meridian==="AM") ? "PM" : "AM") : time.meridian);
            $el.coerce_selection(pos);
        },
        up_arrow_handler: function(self, evt) {
            self.arrow_handler(self, evt, function(n) { return n+1; });
        },
        down_arrow_handler: function(self, evt) {
            self.arrow_handler(self, evt, function(n) {
                if( self.input.$node.is_on("minutes") ) {
                    return (n===0) ? 59 : n-1;
                }
                if( n===0 ) {
                    return 11;
                }
                return (n===1) ? 12 : n-1;
            });
        },
        left_arrow_handler: function(self, evt) {
            evt.preventDefault();
            self.tab_handler(self, evt, true);
        },
        right_arrow_handler: function(self, evt) {
            evt.preventDefault();
            self.tab_handler(self, evt, false);
        },
        backspace_handler: function(self, evt) {
            evt.preventDefault();
            var pos = self.input.$node.cursor();
            self.input.$node.cursor(pos-1);
            self.input.$node.coerce_selection(pos-1);
        },
        is_digit: function(evt) {
            // Ascii '0' is 46 and '9' is 57
            return (evt.keyCode > 45 && evt.keyCode < 58);
        },
        is_digit_allowed_at: function(self, c, i) {
            var allowed = {
                    '0': function(n) { return n===0 || n===1; },
                    '1': function(n) { return (self.input.$node.read(i-1) === "0") ? (n>0) : (n===0 || n===1 || n===2); },
                    '3': function(n) { return n>=0 && n<=5; },
                    '4': function(n) { return true; }
                };
            return allowed[i](Number(c));
        },
        digit_entry: function(self, pos, c) {
            var $el = self.input.$node;
            $el.set_selection(pos, pos);
            $el.write(c);
            $el.set_selection($el.cursor(), $el.cursor()+1);
            return self;
        },
        key_handler: function(self, evt, shiftIsPressed) {
            var handlers = {
                    'tab': self.tab_handler,
                    'up': self.up_arrow_handler,
                    'down': self.down_arrow_handler,
                    'right': self.right_arrow_handler,
                    'left': self.left_arrow_handler,
                    'backspace': self.backspace_handler
                },
                handler = handlers[Widget.identifyKeyEvent(evt)];
            return (handler) ? handler(self, evt, shiftIsPressed) : (function() {
                evt.preventDefault();
                var pos = self.input.$node.cursor(),
                    c = String.fromCharCode(evt.keyCode),
                    meridianIndex = "00:00 ".length;
                if( self.input.$node[0].setSelectionRange &&
                    self.is_digit(evt) &&
                    self.is_digit_allowed_at(self, c, pos) ) {
                      return self.digit_entry(self, pos, c);
                }
                if(self.input.$node.cursor() === meridianIndex && (c === 'P' || c === 'A')) {
                    self.input.$node.write(c);
                    self.input.$node.cursor(self.input.$node.cursor()+2);
                }
                return self;
            })();
        },
        focus_handler: function(self, evt) {
            evt.preventDefault();
            var $node = self.input.$node;
            $node.val((!$node.val() || $node.val().length !== '12:00 AM'.length) ? '12:00 AM' : $node.val());
            $node.cursor(0);
            $node.set_selection(0, 2);
        },
        getValue: function() {
            return this.input.$node.time();
        },
        _initWidgets: function() {
            this._super.apply(this, arguments);
            var $input = this.$el.children('input[type=text]');
            this.input = TextBox(this.$el.children('input[type=text]'));
            this.input.$node.extend(new accessors);
//          this.timeOptions = generate_options(30);
            if(this.input.$node[0].setSelectionRange) {
                this.input.$node.attr('placeholder', this.options.format);
            } else {
                this.input.$node.val('12:00 AM');
            }
        },
        _bindEvents: function() {
            var self = this,
                shiftIsPressed = false;
            self._super.apply(this, arguments);

            self.input.$node.on('focus', function(evt) {
                self.focus_handler(self, evt);
                $(this).trigger('change');
            }).on('click', function(evt) {
                self.focus_handler(self, evt);
                $(this).trigger('change');
            }).on('select', function(evt) {
                evt.preventDefault();
            }).on('keydown', function(evt) {
                evt.preventDefault();
                if(evt.keyCode===16) {
                    shiftIsPressed = true;
                }
                self.key_handler(self, evt, shiftIsPressed);
                $(this).trigger('change');
            }).on('keyup', function(evt) {
                evt.preventDefault();
                if(evt.keyCode===16) {
                    shiftIsPressed = false;
                }
            }).on('blur', function(evt) {
                shiftIsPressed = false;
            });
        }
    });
    return TimePicker;
});
