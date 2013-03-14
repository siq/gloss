define([
    './powergrid'
], function(PowerGrid) {
    return PowerGrid.extend({
        getValue: function() {
            return this.selected();
        }
    });
});
