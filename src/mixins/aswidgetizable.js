define([
    'vendor/underscore',
    './../core/registry',
    './../widgets/user_display/messagelist',
    './../util/widgetize'
], function(_, Registry, MessageList, widgetize) {
    return function() {

        var registry = Registry.getInstance();

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
            },
            viewsDict = function(views) {
                var viewDict = {};
                _.each(views, function(w) {
                    var name = w.$el.attr('name'),
                        data = w.$el.attr('data-bind');
                    if (name) {
                        viewDict[name] = w;
                    } else if (data) {
                        viewDict[data] = w;
                    }
                });
                return viewDict;
            },
            makeViewMessageLists = function($el, views) {
                _.each(views, function(view) {
                    if (view.get('messageList') == null) {
                        var name =  view.$el.attr('name') ||
                                    view.$el.attr('data-bind'),
                            $candidate = $el.find('.messagelist[data-for="'+name+'"]');
                        if ($candidate.length === 1 && !registry.isWidget($candidate)) {
                            view.set('messageList', MessageList($candidate));
                        }
                    }
                });
                return views;
            };


        this._initWidgets = _.wrap(this._initWidgets, function(func) {
            var rest = Array.prototype.slice.call(arguments, 1),
                ret = func.apply(this, rest);
            this.set('widgets', widgetsDict(widgetize(this.$el)));
            return ret;
        });

        this.getWidget = function(name) {
            return this.get('widgets.' + name);
        };
        // this real purpose of wanting to do this is to associate messageLists to a view
        // as a bonus you'll be able to access the view with the `getWidget('name')` API
        this.setViews = function(views) {
            this.set('widgets', viewsDict(views));
            makeViewMessageLists(this.$el, views);
        };
    };
});
