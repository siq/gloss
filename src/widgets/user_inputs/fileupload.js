define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/fields',
    './../../views/form',
    'tmpl!./fileupload/fileupload.mtpl',
    'css!./fileupload/fileupload.css'
], function($, _, fields, Form, template) {

    var iFrame = [
            "<iframe",
                "name='<%= name %>'",
                "class='submissionFrame hidden'",
                "src='<%= src %>' >",
            "</iframe>"
        ].join(' '),
        iFrameTmpl = function(name, src) {
            return _.template(iFrame, {name: name, src: src});
        },
        JSONValidationError = fields.ValidationError.extend({
            token: 'invalid-json',
            message: 'failed to parse json response',
        }),
        FileIdValidationError = fields.ValidationError.extend({
            token: 'file_required',
            message: 'missing file uuid',
        });

    return Form.extend({
        defaults: {
            action: '/upload',
            strings: null,
            src: '/upload',
            display: {
                button: 'Browse...',
                filename: 'No file selected.'
            }
        },
        template: template,
        init: function() {
            this.set('target', _.uniqueId('_targetFrame_'), {silent: true});
            return this._super.apply(this, arguments);
        },
        _initWidgets: function() {
            this._super.apply(this, arguments);
            this.$submissionFrame = $(iFrameTmpl(
                this.get('target'),
                this.get('src')
            )).appendTo(this.$el);
            return this;
        },
        _bindEvents: function() {
            var self = this;
            this._super.apply(this,arguments);
            this.on('change', 'input[type=file]', function() {
                self.set('filename', self.$el.find('input[type=file]').val());
            });
            this.on('click', '.button', function(event) {
                self.$el.find('input.fileupload-input').trigger('click');
            });
            return this;
        },
        getValue: function() {
            return this.get('filename');
        },
        // return a deferred
        // the deferred will resolve with a file uuid form the server or fail
        postUpload: function(evt) {
            var self = this,
                dfd = $.Deferred();

            if (evt) {
                evt.preventDefault();
            }
            if (!this.get('filename')) {
                dfd.reject([[FileIdValidationError()]]);
            } else {
                this.$el.submit();
                this.$submissionFrame.on('load', function() {
                    var postResponse = self.$submissionFrame[0].contentDocument.body,
                        fileUUID;
                    if (postResponse) {
                        try {
                            fileUUID = JSON.parse($(postResponse).html()).file;
                        } catch (e) {
                            console.error('failed to parse json response');
                            dfd.reject([[JSONValidationError()]]);
                            return this;
                        }
                        if (fileUUID) {
                            self.$submissionFrame.unbind('load');
                            dfd.resolve(fileUUID);
                        } else {
                            dfd.reject([[FileIdValidationError()]]);
                        }
                    } else {
                        dfd.reject([[fields.NonNullError('no post response')]]);
                    }
                    return self;
                });
            }
            return dfd;
        },
        submit: function(evt) {
            // our base form submit doesn't play well with the file upload
            // prolly cuz we don't have an offical upload model.
            // we need to utterly destroy this bubble so it doesn't prpagate.
            if (evt) evt.stopPropagation();
            return this;
        },
        update: function(updated) {
            var filename;
            this._super.apply(this, arguments);

            if (updated.filename) {
                filename = this.get('filename').split('\\');
                if (filename && filename[0] !== '') {
                    this.$el.find('span.selectedfile')
                        .text(filename[filename.length-1]);
                }
            }
            return this;
        },
    });
});
