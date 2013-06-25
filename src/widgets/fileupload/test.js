define([
    'vendor/jquery',
    'vendor/underscore',
    './../fileupload',
    'tmpl!./../fileupload/fileupload.mtpl'
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
    });

    var fileUpload = FileUpload( { strings: {
                fileupload: {label: 'Classification Model File',
                             submit: 'Browse...'}
        }});
    fileUpload.appendTo('body');
    
    start();
});
