/**
   Methods to add to a jquery input element for more intuitive interaction with time components
*/
define([
    'vendor/underscore'
], function(_) {
    return function() {

        var format = "hh:mm MM",
            minuteIndex = _.indexOf(format, ":"),
            meridianIndex = _.indexOf(format, " ");

        var ie_set_selection = function(input, start, end) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        };
        var read_range_width = function(input, range) {
            var width = 0;
            var rangeTotal = input.createTextRange();
            while(range.compareEndPoints("EndToStart", rangeTotal) > 0 ) {
                width++;
                range.moveEnd("character", -1);
            }
            return width;
        };
        var ie_get_selection = function(input) {
            var selection = document.selection.createRange();
            if (selection.parentElement() === input) {
                var range = input.createTextRange();
                range.moveToBookmark(selection.getBookmark());
                var width = read_range_width(input, range);
                return width;
            }
            return -1;
        };
        var ie_cursor = function(input, pos) {
            if(pos !== undefined) {
                ie_set_selection(input, pos, pos);
                return null;
            }
            return ie_get_selection(input);
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
                this[0].focus();
                this[0].setSelectionRange(start, end);
            } else {
                ie_set_selection(this[0], start, end);
                this[0].selectionStart=start;
                this[0].selectionEnd=end;
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
                    start = (self.on_component(pos) === "minutes") ? i.minutesStart : start;
                    return (self.on_component(pos) === "meridian") ? i.meridianStart : start;
                },
                bumpStart = bump(pos);
            return this.set_selection(bumpStart, bumpStart+2);
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
        this.on_component = function(position) {
            return (position<3) ? "hours" :
                (position >=3 && position<6) ? "minutes" : "meridian";
        };
    };
});
