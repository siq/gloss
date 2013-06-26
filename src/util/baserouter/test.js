/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    './../baserouter',
    'mesh/model'
], function(BaseRouter, model) {

    function State() {
        var instance,
            StateModel = model.Model.extend({});
        return {
            getInstance: function() {
                return instance || (instance = StateModel());
            }
        };
    }

    test ('there is a defaulte app_base', function(){
        var Router = BaseRouter.extend({
                state: State().getInstance()
            }),
            router = Router();

        ok(router);
        equal(router.app_base, '/', 'router has a default app_base');
    });

    test ('app_base can be overridden', function(){
        var app_base = '/overridden',
            Router = BaseRouter.extend({
                app_base: app_base,
                state: State().getInstance()
            }),
            router = Router();

        equal(router.app_base, app_base, 'default app_base was overridden');
    });

    start();
});
