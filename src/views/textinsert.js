define([
    'vendor/underscore',
    './../mixins/aswidgetizable',
    './../widgets/user_inputs/button',
    './simpleview',
    'tmpl!./textinsert/textinsert.mtpl',
    'tmpl!./textinsert/tr.mtpl',
    'css!./textinsert/textinsert.css',
    'css!./../widgets/user_display/powergrid/powergrid.css'
], function(_, asWidgetizable, Button, SimpleView, template, trTemplate) {
    'use strict';

    // function selectTextareaLine(tarea, lineNum) {
    //     var startPos, endPos, range,
    //         normalizedValue = tarea.value.replace(/\r\n/g, "\n"),
    //         lines = normalizedValue.split("\n");

    //     lineNum--; // array starts at 0

    //     // calculate start/end
    //     startPos = 0, endPos = tarea.value.length;
    //     for(var x = 0; x < lines.length; x++) {
    //         if(x == lineNum) {
    //             break;
    //         }
    //         startPos += (lines[x].length+1);
    //     }
    //     endPos = lines[lineNum].length+startPos;

    //     // do selection
    //     // Chrome / Firefox
    //     if(typeof(tarea.selectionStart) != "undefined") {
    //         tarea.focus();
    //         tarea.selectionStart = startPos;
    //         tarea.selectionEnd = endPos;
    //         return true;
    //     }
    //     // IE
    //     if (document.selection && document.selection.createRange) {
    //         tarea.focus();
    //         tarea.select();
    //         range = document.selection.createRange();
    //         range.collapse(true);
    //         range.moveEnd("character", endPos);
    //         range.moveStart("character", startPos);
    //         range.select();
    //         return true;
    //     }
    //     return false;
    // }
    // function getSelection(textarea) {
    //     var selection, sel, startPos, endPos;
    //     // IE version
    //     if (document.selection != undefined) {
    //         textarea.focus();
    //         sel = document.selection.createRange();
    //         selection = sel.text;
    //     }
    //     // Others
    //     else if (textarea.selectionStart != undefined) {
    //         startPos = textarea.selectionStart;
    //         endPos = textarea.selectionEnd;
    //         selection = textarea.value.substring(startPos, endPos);
    //     }
    //     return selection;
    // }
    // function getIELineNumber(lines, cursorPos) {
    //     var lineNum = 0, indexPos = 0, line;
    //     for (var i=0; i < lines.length; i++) {
    //         line = lines[i];
    //         if (cursorPos >= indexPos && cursorPos <= indexPos + line.length) {
    //             return lineNum+1;
    //         }
    //         lineNum++;
    //         indexPos += line.length+1;
    //     }
    //     return undefined;
    // }
    // function getInputSelection(el) {
    //     var start = 0, end = 0, line = 0, lines = el.value.split("\n"),
    //         normalizedValue, range, textInputRange, len, endRange;

    //     if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
    //         start = el.selectionStart;
    //         end = el.selectionEnd;
    //         line = el.value.substr(0, el.selectionStart).split("\n").length;
    //     } else {
    //         range = document.selection.createRange();

    //         if (range && range.parentElement() == el) {
    //             len = el.value.length;
    //             normalizedValue = el.value.replace(/\r\n/g, "\n");

    //             // Create a working TextRange that lives only in the input
    //             textInputRange = el.createTextRange();
    //             textInputRange.moveToBookmark(range.getBookmark());

    //             // Check if the start and end of the selection are at the very end
    //             // of the input, since moveStart/moveEnd doesn't return what we want
    //             // in those cases
    //             endRange = el.createTextRange();
    //             endRange.collapse(false);

    //             if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
    //                 start = end = len;
    //             } else {
    //                 start = -textInputRange.moveStart("character", -len);
    //                 start += normalizedValue.slice(0, start).split("\n").length - 1;

    //                 if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
    //                     end = len;
    //                 } else {
    //                     end = -textInputRange.moveEnd("character", -len);
    //                     end += normalizedValue.slice(0, end).split("\n").length - 1;
    //                 }
    //             }
    //         }
    //         line = getIELineNumber(lines, start);
    //     }
    //     return {
    //         start: start,
    //         end: end,
    //         line: line
    //     };
    // }

    var TextInsert = SimpleView.extend({
        template: template,
        defaults: {
            placeholder: 'Enter term and click add',
            selectedAttr: null
        },

        init: function() {
            var ret = this._super.apply(this, arguments);

            if (this.get('selectedAttr') == null) {
                this.set({
                    selectedAttr: '_' + this.el.id + '_selected'
                }, {silent: true});
            }
            return ret;
        },
        _bindEvents: function() {
            var self = this,
                ret = this._super.apply(this, arguments);

            _.bindAll(this, 'add', 'remove', 'removeAll');

            this.on('click', '[name=add]', this.add);
            this.on('click', '[name=remove]', this.remove);
            this.on('click', '[name=remove-all]', this.removeAll);
            this.on('click', 'table tr', function(evt) {
                var clickedModel = self._modelFromTr(evt.currentTarget);
                self._select(clickedModel);
            });
            this.on('keyup', '[name=term-input]', function(evt) {
                var enter = 13, key = evt.which;
                if (key === enter) {
                    self.add();
                }
            });
            // this.on('click', 'textarea', function(evt) {
            //     var textarea = evt.target,
            //         range = getInputSelection(textarea),
            //         line = range.line;
            //     if (!line) return;
            //     selectTextareaLine(textarea, line);
            // });

            return ret;
        },
        _modelFromTr: function(tr) {
            var idx = this.$rows.children('tr').index(tr);
            return idx >= 0? this.get('models')[idx] : null;
        },
        _renderRows: function() {
            var rows = [], models = this.get('models');

            if (!models) return;
            for (var i = 0, l = models.length; i < l; i++) {
                rows.push(trTemplate(models[i]));
            }
            this.$rows = this.$rows || this.$el.find('.rows');
            this.$rows.html(rows.join(''));
            return this;
        },
        _select: function(model) {
            var selectedAttr = this.get('selectedAttr'),
                models = (this.get('models') || []).slice(), // get a copy so the change is reflected on seet
                selectedModel = _.find(models, function(model) {
                    return model[selectedAttr];
                });

            if (selectedModel === model) return;
            if (selectedModel) {
                selectedModel[selectedAttr] = undefined;
            }
            model[selectedAttr] = true;
            this.set('models', models);
            this.getWidget('remove').$node.focus();
            return this;
        },
        add: function(evt) {
            var termInput = this.getWidget('term-input'),
                // terms = this.getWidget('terms'),
                // terms = this.getValue().slice(), // get a copy so the change is reflected
                models = (this.get('models') || []).slice(), // get a copy so the change is reflected on seet
                newValue = termInput.getValue();

            termInput.setValue(null);
            termInput.$node.focus();
            if (newValue.trim().length < 1) return;

            // newValue = terms.getValue().length ?
            //     terms.getValue() + '\n' + newValue : newValue;
            // terms.setValue(newValue);
            // terms.push(newValue);
            // this.setValue(terms);
            models.push({
                index: models.length,
                value: newValue,
                self: this
            });
            this.set('models', models);
            return this;
        },
        getValue: function() {
            return _.pluck(this.get('models'), 'value');
        },
        remove: function(evt) {
            // var terms = this.getWidget('terms'),
            //     textarea = terms.node,
            //     selection = getSelection(textarea),
            //     line = getInputSelection(textarea).line,
            //     values = terms.getValue().split('\n');

            // if (selection.length < 1) return;

            // values.splice(line-1, 1);
            // terms.setValue(values.join('\n'));
            var terms = this.getValue().slice(), // get a copy so the change is reflected
                models = (this.get('models') || []).slice(),
                selectedAttr = this.get('selectedAttr'),
                index, newSelection,
                selected = _.find(models, function(model) {
                    return model[selectedAttr] === true;
                });

            if (!selected) return;

            index = _.indexOf(models, selected);
            models.splice(index, 1);
            newSelection = models[index] || models[index-1] || models[index+1];
            if (newSelection) {
                newSelection[selectedAttr] = true;
            }
            this.set('models', models);
            this.getWidget('remove').$node.focus();
            return this;
        },
        removeAll: function(evt) {
            // var terms = this.getWidget('terms');
            // terms.setValue(null);
            this.set('terms', []);
            return this;
        },
        setValue: function(values) {
            if (values === undefined) {
                values = [];
            }
            this.set('terms', _.isArray(values) ? values : [values]);
            return this;
        },
        show: function() {
            this.getWidget('term-input').$node.focus();
            return this;
        },
        update: function(changed) {
            var self = this;
            if (changed.terms) {
                // make an array of object to manipulate the selected property without
                // involving the DOM
                var models = _.map(self.get('terms'), function(term, i) {
                    return {
                        value: term,
                        self: self
                    };
                });
                self.set('models', models);
            }
            if (changed.models) {
                this.waitForInitialRender.then(function() {
                    self._renderRows();
                });
            }
        }
    });

    asWidgetizable.call(TextInsert.prototype);

    return TextInsert;
});
