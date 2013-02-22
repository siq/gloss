define([
    'vendor/underscore',
    './widgetize'
], function(_, widgetize) {
    return function() {

        var widgetsDict = function(widgets) {
            var widgetDict = {};
            _.each(widgets, function(w) {
                var name = w.$node.attr('name'),
                    data = w.$node.attr('data-bind');
                if (name) {
                    widgetDict[name] = w;
                }
                if (data && name !== data) {
                    widgetDict[data] = w;
                }
            });
            this.set('widgets', widgetDict);
        };

        this._initWidgets = _.wrap(this._initWidgets, function(func) {
            var rest = Array.prototype.slice.call(arguments, 1),
                ret = func.apply(this, rest);
                this.widgets = widgetize(this.$el);
                widgetsDict.call(this, this.widgets);
            return ret;
        });
        this.getWidget = function(name) {
            return this.get('widgets')[name];
        };
    };
});
