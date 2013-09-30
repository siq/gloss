/**
   Methods to add to a jquery input element for more intuitive interaction with time components
*/
define([
    'vendor/underscore'
], function(_) {
    return function() {
        var format = "hh:mm MM",
            minuteIndex = format.indexOf(":"),
            meridianIndex = format.indexOf(" ");

        var ie_cursor = function(input, pos) {
            if(pos !== undefined) {
                console.log('ie cursor activated');
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                return null;
            }
            return input.text.length;
        };
        var normal_cursor = function(input, pos) {
            if(pos !== undefined) {
                input.focus();
                input.setSelectionRange(pos, pos);
                return null;
            }
            return input.selectionStart;
        };
        var inc_cursor = function(i) {
            return (i===minuteIndex-1 || i===meridianIndex-1) ? i+=2 : ++i;
        };

        this.cursor = function() {
            var ret = (this[0].setSelectionRange) ?
                    normal_cursor(this[0], arguments[0]) :
                    ie_cursor(this[0], arguments[0]);
            return (ret===null) ? this : ret;
        };
        this.set_selection = function(start, end) {
            if (this[0].setSelectionRange) {
               this[0].setSelectionRange(start, end);
            } else {
                var range = this[0].createTextRange();
                range.moveStart("character", start);
                range.moveEnd("character", end);
                range.select();
            }
            return this;
        };
        this.coerce_selection = function(pos) {
            var self = this.cursor(0),
                width = "nn".length,
                i = {
                    hoursStart: 0,
                    minutesStart: "nn:".length,
                    meridianStart: "nn:nn ".length
                },
                bump = function(n) {
                    var start = 0;
                    start = (self.on(pos) === "minutes") ? i.minutesStart : start;
                    return (self.on(pos) === "meridian") ? i.meridianStart : start;
                },
                bumpStart = bump(pos);
            return self.set_selection(bumpStart, bumpStart+2);
        };
        this.hour = function() {
            if(arguments[0]!==undefined) {
                var split = this.val().split(':'),
                    time = String(arguments[0]) + ':' + split[1];
                return this.val(time);
            }
            return Number(this.val().substring(0, this.val().indexOf(':')));
        };
        this.minutes = function() {
            if(arguments[0] !== undefined) {
                var split = this.val().split(':'),
                    rest = split[1].split(' ');
                return this.val(split[0] + ':' + arguments[0] + ' ' + rest[1]);
            }
            return this.val().substring(this.val().indexOf(':')+1, _.indexOf(this.val(), ' '));
        };
        this.meridian = function() {
            if(arguments[0] !== undefined) {
                var split = this.val().split(' ');
                return this.val(split[0] + ' ' + arguments[0]);
            }
            return this.val().substring(this.val().indexOf(' ')+1, this.val().length);
        };
        this.write = function(val) {
            var i = this.cursor(),
                v = this.val(),
                before = v.substring(0, i),
                after = v.substring(i+1, v.length),
                ret = this.val(before + val + after);
            this.cursor(inc_cursor(i));
            return this;
        },
        this.read = function(i) {
            return this.val().charAt(i);
        },
        this.time = function() {
            if(arguments.length!==0) {
                this.val(arguments[0] + ':' + arguments[1] + ' ' + arguments[2]);
                return this.val();
            }
            // This should have the format of other component functions
            return {hours: this.hour(), minutes: this.minutes(), meridian: this.meridian()};
        };
        this.is_on = function(key) {
            var pos = this.cursor(),
                keys = {
                    "hours": function(p) { return (p<3); },
                    "minutes": function(p) { return (pos>=3 && pos<6); },
                    "meridian": function(p) { return (pos >= 6); }
                };
            return keys[key](pos);
        };
        this.on = function(position) {
            return (position<3) ? "hours" :
                (position >=3 && position<6) ? "minutes" : "meridian";
        };
    };
});
