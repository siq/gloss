define([
    'vendor/jquery',
    'vendor/jquery-ui',
    'vendor/underscore',
    './registry',
    'bedrock/class',
    'css!./../style/base.css'
], function($, ui, _, Registry, Class) {
    var slice = Array.prototype.slice;

    
    var BaseWidget = Class.extend({
        nodeTemplate: '<div>',

        init: function(node) {
            var html;
            if (node == null) {
                this.$node = $(this._compiledHtml());
            } else {
                this.$node = $(node);
            }
            if (this.prepareNode) {
                this.$node = this.prepareNode(this.$node);
            }
            if (this.$node.length !== 1) {
                throw new Error('widget $node must be only one DOM node: ' + node);
            }
            this.node = this.$node.get(0);
        },

        _compiledHtml: function(context) {
            context = context == null? this : context; 
            return _.isFunction(this.nodeTemplate)?
                this.nodeTemplate(context) :
                this.nodeTemplate;
        },

        hide: function(params) {
            this.$node.addClass('hidden');
            return this;
        },

        invoke: function(name) {
            var method = this[name];
            if (method != null) {
                method.apply(this, slice.call(arguments, 1));
                return true;
            } else {
                this.propagate.apply(this, arguments);
            }
            return false;
        },

        off: function() {
            this.$node.off.apply(this.$node, arguments);
            return this;
        },

        on: function() {
            this.$node.on.apply(this.$node, arguments);
            return this;
        },

        propagate: function() {
            return this;
        },

        show: function(params) {
            this.$node.removeClass('hidden');
            return this;
        },

        trigger: function() {
            this.$node.trigger.apply(this.$node, arguments);
            return this;
        },

        triggerHandler: function() {
            this.$node.triggerHandler.apply(this.$node, arguments);
            return this;
        },

        // 'obj' can be either a Widget, a DOM node, or a jQuery-wrapped node
        append: function(obj) {
            if (obj.$node) {
                this.$node.append(obj.$node);
            } else {
                this.$node.append(obj);
            }
            return this;
        },

        appendTo: function(obj) {
            if (obj.$node) {
                this.$node.appendTo(obj.$node);
            } else {
                this.$node.appendTo(obj);
            }
            return this;
        },

        prependTo: function(obj) {
            this.$node.prependTo(obj.$node? obj.$node : obj);
            return this;
        }
    });
    return BaseWidget;
});