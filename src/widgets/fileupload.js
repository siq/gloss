define([
    'vendor/jquery',
    'vendor/underscore',
    './../widgets/simpleview',
    'tmpl!./fileupload/fileupload.mtpl'
], function($, _, SimpleView, template) {
    return SimpleView.extend({
        template: template
    });
    
});
