define([
    'vendor/jquery',
    'vendor/underscore',
    'mesh/fields',
    './../../views/form',
    'tmpl!./fileupload/fileupload.mtpl',
    'css!./fileupload/fileupload.css'
], function($, _, fields, Form, template) {

    return Form.extend({
        defaults: {
            action: '/upload',
            src: '/upload',
            display: {
                label: 'label',
                databind: 'databind',
                button: 'Browse...'
            }
        },
        template: template,
        _bindEvents: function() {
            var self = this;
            this._super.apply(this,arguments);
            this.on('change', 'input[type=file]', function() {
                self.set('filename', self.$el.find('input[type=file]').val());
            });
            return this;
        },
        getValue: function() {
            return this.get('filename');
        },
        postUpload: function(evt) {
            var self = this,
                dfd = $.Deferred(),
                $submissionFrame = this.$el.find('#submissionFrame');

            if (evt) {
                evt.preventDefault();
            }
            if (!this.get('filename')) {
                dfd.reject(fields.NonNullError('no file selected for upload'));
            } else {
                // Don't upload the same file more than once, if it's the same file...
                this.$el.find('form').submit();
                // this.$el.find('form').submit(evt);
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
            this._super.apply(this, arguments);
            return this;
        },
        submit: function(evt) {
            // our base form submit doesn't play well with the file upload
            // prolly cuz we don't have an offical upload model.
            // we need to utterly destroy this bubble so it doesn't prpagate.
            if (evt) evt.stopPropagation();
            return this;
        }
    });
});
