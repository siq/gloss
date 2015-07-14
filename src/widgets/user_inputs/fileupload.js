define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/fields',
    './../../views/form',
    'tmpl!./fileupload/fileupload.mtpl',
    'css!./fileupload/fileupload.css'
], function($, _, fields, Form, template) {

    var $submissionFrame,
        iFrame = [
            "<iframe",
                "name='<%= name %>'",
                "class='submissionFrame hidden'",
                "src='<%= src %>' >",
            "</iframe>"
        ].join(' '),

        iFrameTmpl = function(name, src) {
            return _.template(iFrame, {name: name, src: src});
        };

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
            $submissionFrame = $(iFrameTmpl(
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
                dfd.reject(fields.NonNullError('no file selected for upload'));
            } else {
                this.$el.submit();
                // this.$el.submit(evt);
                $submissionFrame.on('load', function() {
                    var postResponse = $submissionFrame[0].contentDocument.body,
                        fileUUID;
                    if (postResponse) {
                        fileUUID = JSON.parse($(postResponse).html()).file;
                        if (fileUUID) {
                            $submissionFrame.unbind('load');
                            dfd.resolve(fileUUID);
                        } else {
                            dfd.reject(fields.NonNullError('no file uuid'));
                        }
                    } else {
                        dfd.reject(fields.NonNullError('no post response'));
                    }
                    return this;
                });
            }
            return dfd;
        },
        show: function() {
            var fileInputClone;
            this._super.apply(this, arguments);

            /* IE 8 wont allow programmatic reseting of a file input's value. */
            // fileInputClone = this.$el.find('.fileupload-input').clone(true);
            // fileInputClone.val(''); // ff retains this value, ie8 doesn't
            // this.$el.find('.fileupload-input').remove();
            // this.$el.find('.button').append(fileInputClone);
            return this;
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
