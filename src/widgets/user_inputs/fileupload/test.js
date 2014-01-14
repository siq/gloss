define([
    'vendor/jquery',
    'vendor/underscore',
    './../fileupload',
    'tmpl!./fileupload.mtpl'
], function($, _, FileUpload, template) {
    
    test('instantiation', function() {
        var strings = {
            fileupload: {label: 'fileupload label',
                         submit: 'submit'}
        };
        var fileUpload = FileUpload({
            strings: {
                fileupload: {label: 'fileupload label',
                             submit: 'submit'}
        }
        });
        ok(fileUpload, 'not null');
        fileUpload.appendTo('body');
    });

    start();
});
