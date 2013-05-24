define([
    "vendor/jquery"
],function($) {
    var FadeQueue = function(fadeSpeed, minOpacity, maxOpacity, element) {
        var self = this,
            fadeRate = fadeSpeed,
            min = minOpacity,
            max = maxOpacity,
            queue = [],
            $toFade = $(element),
            locked = false,
            isOuterLocked = false;

        var destroyIntermediateStates = function() {
            if(queue.length > 1) {
                queue = queue.slice(queue.length-1, queue.length);
            }
            if(!isOuterLocked) {
                self.release();
            }
        };

        var processQueue = function() {
            destroyIntermediateStates();
            var direction = queue.shift();
            if(direction === 'in') {
                $toFade.css("z-index", "130");
                $toFade.fadeTo(fadeRate, max, function() {
                    // Do nothing after
                });
            } else if (direction === 'out') {
                console.log('out triggered');
                $toFade.fadeTo(fadeRate, min, function() {
                    $toFade.css("z-index", "-30");
                });
            }

        };

        self.outerLock = function() {
            locked = true;
            isOuterLocked = true;
        };

        self.clockLock = function(duration) {
            locked = true;
            isOuterLocked = true;
            setTimeout(function() {
                locked = false;
                isOuterLocked = false;
            }, duration);
        };

        self.release = function() {
            locked = false;
        };

        self.start = function() {
            setInterval(function() {
                processQueue();
            }, fadeRate+50);
        };

        /* Only accepts values of 'in' or 'out' */
        self.fade = function(direction) {
            if(!locked) {
                queue.push(direction);
            }
        };

    };
    return FadeQueue;
});
