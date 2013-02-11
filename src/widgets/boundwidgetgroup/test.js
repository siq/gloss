/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'mesh/request',
    'mesh/tests/example',
    'bedrock/class',
    './../messagelist',
    './../boundwidgetgroup',
    'tmpl!./testtmpl.mtpl',
    './../../test/api/v1/targetvolumeprofile'
], function(Request, Example, Class, MessageList, BoundWidgetGroup, template,
    TargetVolumeProfile) {

    var origAjax = Request.ajax(function(args) {
        var data = args.data;
        window.lastAjaxArgs = args;
        if (/some-invalid-chars/.test(JSON.parse(data).name)) {
            args.error({
                getResponseHeader: function() {return 'application/json';},
                responseText: JSON.stringify([[{
                        token: 'servererror',
                        message: 'something went wrong server-side'
                    }], {
                    name: [{
                        token: 'nonempty',
                        message: 'name must not be empty'
                    }]
                }])
            });
        } else {
            args.success({resources: []}, 200, {});
        }
    });

    asyncTest('boundwidgetgroup correctly handles server-side errors', function() {
        var bwg = window.bwg = BoundWidgetGroup(template(), {
            widgetize: true,
            modelClass: TargetVolumeProfile,
            bindings: [
                {widget: 'name', field: 'name'},
                {widget: 'volume_id', field: 'volume_id'}
            ]
        });

        bwg.set({
            messageList: MessageList(bwg.$node.find('.messagelist').first())
        }).getModel().set({
            name: 'some-invalid-chars', volume_id: 4
        });

        bwg.initiateUpdate(function(model) {
            return model.save();
        }).done(function() {
            ok(false, 'save should have thrown an error');
            start();
        }).fail(function() {
            ok(true, 'save correctly throws error');
            bwg.processErrors.apply(bwg, arguments);
            ok(/something went wrong server-side/
                .test(bwg.options.messageList.$node.text()));
            ok(/name must not be empty/
                .test(bwg.getWidget('name').options.messageList.$node.text()));
            start();
        });
    });

    asyncTest('boundwidgetgroup correctly handles client-side errors', function() {
        var bwg = window.bwg = BoundWidgetGroup(template(), {
            widgetize: true,
            modelClass: TargetVolumeProfile,
            bindings: [
                {widget: 'name', field: 'name'},
                {widget: 'volume_id', field: 'volume_id'}
            ]
        });

        bwg.set('messageList',
            MessageList(bwg.$node.find('.messagelist').first()));

        bwg.initiateUpdate(function(model) {
            model.set('name', bwg.getWidget('name').getValue());
            return model.save();
        }).done(function() {
            ok(false, 'save should have thrown an error');
            start();
        }).fail(function() {
            ok(true, 'save correctly throws error');
            bwg.processErrors.apply(bwg, arguments);
            ok(/missing/
                .test(bwg.getWidget('volume_id').options.messageList.$node.text()));
            start();
        });
    });

    asyncTest('updates to model are propagated to bound widgets', function() {
        var bwg = window.bwg = BoundWidgetGroup(template(), {
                widgetize: true,
                modelClass: TargetVolumeProfile,
                bindings: [{widget: 'name', field: 'name'}, {widget: 'additional_info.alias', field: 'additional_info.alias'}]
            }),
            model = bwg.getModel(),
            thisGuyIsCompletely = 'unscrupulous',
            andIsKnownAs  = 'don';

        model.prop('additional_info.alias', andIsKnownAs);
        model.prop('name', thisGuyIsCompletely);
        // bwg.bindModel();
        
        setTimeout(function() {
            equal(bwg.getWidget('name').getValue(), thisGuyIsCompletely);
            equal(bwg.$node.find('[name=name]').val(), thisGuyIsCompletely);
            equal(bwg.getWidget('additional_info.alias').getValue(), andIsKnownAs);
            equal(bwg.$node.find('[name="additional_info.alias"]').val(), andIsKnownAs);
            
            start();
        }, 0);
    });

    asyncTest('override mappings', function() {
        var testValue = 'volume_id value',
            testObject = {volume_id: testValue},
            bwg = BoundWidgetGroup(template(), {
                widgetize: true,
                modelClass: TargetVolumeProfile,
                bindings: [
                    {widget: 'name', field: 'name'},
                    {widget: 'volume_id', field: 'volume_id'}
                ],
                mappings: {
                    // mapping('toObject', name, value);
                    // mapping('getValue', model, name);
                    volume_id: function(evt, opts) {
                        if (evt === 'getValue') {
                            ok(opts.hasOwnProperty('name'), 'getValue options include name');
                            ok(opts.hasOwnProperty('model'), 'getValue options include model');
                        } else if (evt === 'toObject') {
                            ok(opts.hasOwnProperty('name'), 'toObject options include name');
                            ok(opts.hasOwnProperty('value'), 'toObject options include value');
                        }
                        return (evt === 'getValue')? testValue : testObject;
                    }
                }
            }),
            model = bwg.getModel();

        // mapping('getValue', {model: model, name: name});
        var v = bwg.getModelValue('volume_id');
        equal(v, testValue, 'volume_id is equal to the overridden value');
        // mapping('toObject', {name: name, value: value});
        var ov = bwg.toModelObject('volume_id');
        equal(ov, testObject, 'volume_id is equal to the overridden value');

        // getBoundValues honors mappings
        // this is a bit of an awkward case if testObect did not contain a matching key
        //      i.e. {test: testvalue} instead of {volume_id: testValue}
        // then `getBoundValues would return `bv['volume_id'] === undefined`
        var bv = bwg.getBoundValues();
        equal(bv['volume_id'], testObject['volume_id'], 'boundValue volume_id is equal to the overridden value');
        start();
    });

    start();
});
