define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/moment',
    './widget',
    './formwidget',
    './basemenu',
    './textbox',
    './timepicker/accessors',
    'tmpl!./timepicker/timepicker.mtpl'
], function($, _, moment, Widget, FormWidget, BaseMenu, TextBox, accessors, template) {

    var TimePicker = FormWidget.extend({
        defaults: {
            format: 'hh:mm A'
        },
        nodeTemplate:template,

        tab_handler: function(evt, shiftIsPressed) {
            var $node = this.input.$node,
                pos = $node.cursor();
            
            if((shiftIsPressed && pos>="00:".length) ||
               (!shiftIsPressed && pos < "00:00 ".length) ) {
                evt.preventDefault();
            }
            $node.coerce_selection((shiftIsPressed) ? pos-3 : pos+3);
        },
        arrow_handler: function(evt, func) {
            evt.preventDefault();
            var $node = this.input.$node,
                pos = $node.cursor(),
                time = $node.time(),
                duexgitize = function(num) {
                    return (String(num).length==1) ? "0" + num : num;
                };
            $node.time( ( $node.is_on("hours") ) ? duexgitize(Math.abs(func(Number(time.hours)%12))) : duexgitize(time.hours),
                        ( $node.is_on("minutes") ) ? duexgitize(func(Number(time.minutes))%60) : duexgitize(time.minutes),
                        ( $node.is_on("meridian") ) ? ((time.meridian==="AM") ? "PM" : "AM") : time.meridian);
            $node.coerce_selection(pos);
        },
        up_arrow_handler: function(evt) {
            this.arrow_handler(evt, function(n) { return n+1; });
        },
        down_arrow_handler: function(evt) {
            var self=this;
            this.arrow_handler(evt, function(n) {
                if( self.input.$node.is_on("minutes") ) {
                    return (n===0) ? 59 : n-1;
                }
                if( n===0 ) {
                    return 11;
                }
                return (n===1) ? 12 : n-1;
            });
        },
        left_arrow_handler: function(evt) {
            evt.preventDefault();
            this.tab_handler(evt, true);
        },
        right_arrow_handler: function(evt) {
            evt.preventDefault();
            this.tab_handler(evt, false);
        },
        backspace_handler: function(evt) {
            evt.preventDefault();
            var pos = this.input.$node.cursor();
            this.input.$node.cursor(pos-1);
            this.coerce_selection(pos-1);
        },
        is_digit: function(evt) {
            // Ascii '0' is 46 and '9' is 57
            return (evt.keyCode > 45 && evt.keyCode < 58);
        },
        is_digit_allowed_at: function(c, i) {
            var self = this,
                allowed = {
                    '0': function(n) { return n===0 || n===1; },
                    '1': function(n) { return (self.input.$node.read(i-1) === "0") ? (n>0) : (n===0 || n===1 || n===2); },
                    '3': function(n) { return n>=0 && n<=5; },
                    '4': function(n) { return true; }
                };
            return allowed[i](Number(c));
        },
        digit_entry: function(self, pos, c) {
            var $node = self.input.$node;
            $node.set_selection(pos, pos).write(c).set_selection($node.cursor(), $node.cursor()+1);
            return self;
        },
        key_handler: function(evt, shiftIsPressed) {
            var self = this,
                handlers = {
                    'tab': self.tab_handler,
                    'up': self.up_arrow_handler,
                    'down': self.down_arrow_handler,
                    'right': self.right_arrow_handler,
                    'left': self.left_arrow_handler,
                    'backspace': self.backspace_handler
                },
                handler = handlers[Widget.identifyKeyEvent(evt)];
            return (handler) ? handler(evt, shiftIsPressed) : (function() {
                evt.preventDefault();
                var pos = self.input.$node.cursor(),
                    c = String.fromCharCode(evt.keyCode),
                    meridianIndex = "00:00 ".length;
                if( self.is_digit(evt) && self.is_digit_allowed_at(c, pos) ) {
                    return self.digit_entry(self, pos, c);
                }
                if(self.input.$node.cursor() === meridianIndex && (c === 'P' || c === 'A')) {
                    self.input.$node.write(c);
                    self.input.$node.cursor(self.input.$node.cursor()+2);
                }
                return self;
            })();
        },
        focus_handler: function(evt) {
            evt.preventDefault();
            var $node = this.input.$node;
            $node.val((!$node.val()) ? '12:00 AM' : $node.val());
            $node.cursor(0).set_selection(0, 2);
            /* Something is happening after that overwrites the selection on tab in... */
        },
        getValue: function() {
            return this.input.$node.time();
        },
        create: function() {
            var self = this,
                $input = self.$node.children('input[type=text]'),
                shiftIsPressed = false;
            $input = $input.extend(new accessors());

            self._super.apply(this, arguments);
            
            self.input = TextBox(self.$node.children('input[type=text')).on('focus click', function(evt) {
                self.focus_handler(evt);
            }).on('select', function(evt) {
                evt.preventDefault();
                // do nothing
            }).on('keydown', function(evt) {
                if(evt.keyCode===16) {
                    shiftIsPressed = true;
                }
                self.key_handler(evt, shiftIsPressed);
            }).on('keyup', function(evt) {
                if(evt.keyCode===16) {
                    shiftIsPressed = false;
                }
            }).on('blur', function(evt) {
                shiftIsPressed = false;
            });
            self.input.$node.extend(new accessors);
        }
    });
    return TimePicker;
});
