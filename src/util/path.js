define([
    'vendor/underscore'
], function(_) {
    var SEP = '/';

    var path = {
        normalize: function(p) {
            return (p.charAt(0) === SEP? '/' : '') +

                _.reduce(_.compact(p.split(SEP)), function(memo, d, i) {
                    return memo.length > 0 && d === '..'?
                        memo.slice(0, -1) : memo.concat(d);
                }, []).join(SEP) +

                (p.substr(-1) === SEP && !/^\/+$/.test(p)? '/' : '');
        },

        join: function(p1, p2) {
            var len = arguments.length,
                rest = Array.prototype.slice.call(arguments, 1);
            return len > 2?
                path.join(p1, path.join.apply(path, rest)) :
                path.normalize(p1 + '/' + p2);
        }
    };

    return path;
});
