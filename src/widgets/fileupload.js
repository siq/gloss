define([
    'vendor/jquery',
    'vendor/underscore',
    './../views/form',
    'tmpl!./fileupload/fileupload.mtpl',
    'css!./fileupload/fileupload.css'
], function($, _, Form, template) {
    return Form.extend({
        defaults: {action: '/upload', src: '/upload',
                   display: {label: 'label',
                             databind: 'databind',
                             button: 'Browse...'}},
        template: template,
        _bindEvents: function() {
            this._super.apply(this,arguments);
            $(this.$el.find('input[type=file]')).change(function() {
                $('.fileinput-display').val($(this).val());
            });
        },
        submit: function() {
            // do nothing for now
        }
    });
});
