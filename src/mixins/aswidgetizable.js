define([
    'vendor/underscore',
    './../util/widgetize'
], function(_, widgetize) {
    return function() {

        var widgetsDict = function(widgets) {
            var widgetDict = {};
            _.each(widgets, function(w) {
                var name = w.$node.attr('name'),
                    data = w.$node.attr('data-bind');
                if (name) {
                    widgetDict[name] = w;
                } else if (data) {
                    widgetDict[data] = w;
                }
            });
            return widgetDict;
        };

        this._initWidgets = _.wrap(this._initWidgets, function(func) {
            var rest = Array.prototype.slice.call(arguments, 1),
                ret = func.apply(this, rest);
            this.set('widgets', widgetsDict(widgetize(this.$el)));
            return ret;
        });
        this.getWidget = function(name) {
            return this.get('widgets')[name];
        };
    };
});
