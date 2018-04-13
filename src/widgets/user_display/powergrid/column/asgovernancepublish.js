//*********************** COPYRIGHT START *********************************
// Licensed Materials - Property of IBM
// 5725-M86
// Copyright IBM Corp. 2015, 2017 All Rights Reserved.
// US Government Users Restricted Rights - Use, duplication or
// disclosure restricted by GSA ADP Schedule Contract with
// IBM Corp.
//*********************** COPYRIGHT END ***********************************
define([
    'vendor/jquery',
    'vendor/underscore',
    './../column'
], function($, _, Column) {

    return function asGovernancePublish(opts) {
        if (opts && opts.prototype && opts.extend) {
            asGovernancePublish.apply(opts.prototype,
                Array.prototype.slice.call(arguments, 1));
            return opts;
        }

        this.formatValue = _.wrap(this.formatValue,
                function(formatValue, value, model) {
                    var rest = Array.prototype.slice.call(arguments, 1);
                    return (model.governance_sync_state != null &&
                            model.governance_sync_state.sync_type == "INFERRED_PARTIAL") ?
                                opts.inferredValue : formatValue.apply(this, rest);
                });
        this.getSortValue = function(model) {
                return this.formatValue(this.getValue(model), model);
        };
    };

});

