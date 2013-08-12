define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/path',
    'bedrock/class',
    'bedrock/mixins/assettable',
    './path'
], function($, _, Path, Class, asSettable, path) {
    // BaseRouter provides an interface by which apps can specify routes.
    // BaseRouter class that serves as our 'url bar view'.
    // it interacts with the page state and takes care of things like:
    //      * initialization
    //      * base url
    //      * calculating urls

    var state, base, baseUrlRe;

    function withoutBase(pathname) {
        return pathname === '/'? pathname : pathname.replace(baseUrlRe, '/');
    }

    // once we get this right, let's move it into gloss
    var BaseRouter = Class.extend({
        init: function(options) {
            this.set(options);
            if (!this.state) {
                throw Error('BaseRouter must be provided a state object');
            }
            if (!this.app_base) {
                this.app_base = '/';
            }
            state = this.state;
            base = this.app_base;
            baseUrlRe = new RegExp('^' + base);

            _.bindAll(this, '_onStateChange');
            this.state.on('change', this._onStateChange);
        },
        _onStateChange: function() {
            this.set('url', this.urlFor());
        },

        _setStateFromInitialUrl: function() {
            Path.dispatch(location.pathname);
        },

        // override this function to add a bunch of these:
        //
        //  this.map('/my/url', function() {/* set page state accordingly */});
        //
        // it essentially sets up the functions that map url strings to actions
        // that act on the page state
        _setUpRoutes: function() { },

        // override this to translate the stateObject argument into a url string
        _urlFromState: function(stateObject) { return '/'; },

        // override this to perform more initialization actions on startup
        load: function() {
            this._setUpRoutes();
            this._setStateFromInitialUrl();
            Path.history.listen(true);
            return $.Deferred().resolve();
        },

        map: function(p, fn) {
            Path.map(path.join(base, p)).to(fn);
            return this;
        },

        update: function(changed) {
            if (changed.url) {
                Path.history.pushState({}, null, this.get('url'));
            }
        },
        urlFor: function() {
            var stateObject = {},
                os = [this.state]
                        .concat(Array.prototype.slice.call(arguments, 0));
            _.each(os, function(o) {
                for (var p in o) {
                    if (o.hasOwnProperty(p) && !/^_/.test(p)) {
                        stateObject[p] = o[p];
                    }
                }
            });
            return path.join(base, this._urlFromState(stateObject));
        }
    });

    asSettable.call(BaseRouter.prototype, {onChange: 'update'});

    return BaseRouter;
});