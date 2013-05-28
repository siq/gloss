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
            isOuterLocked = false,
            currentDirection;
        var destroyIntermediateStates = function() {
            if( queue.length > 1 ) {
                queue = queue.slice( queue.length-1, queue.length );
            }
            if( !isOuterLocked ) {
                self.release();
            }
        };
        var processQueue = function() {
            destroyIntermediateStates();
            var direction = queue.shift();
            if (direction === 'in') {
                $toFade.css("z-index", "130");
                $toFade.fadeTo(fadeRate, max, function() {
                    // Do nothing after
                });
                currentDirection = direction;
            } else if (direction === 'out') {
                $toFade.fadeTo(fadeRate, min, function() {
                    $toFade.css("z-index", "-30");
                });
                currentDirection = direction;
            }
            queue = [];
            direction = null;
        };
        self.outerLock = function() {
            locked = true;
            isOuterLocked = true;
        };
        self.clockLock = function(duration) {
            locked = true;
            isOuterLocked = true;
            setTimeout( function() {
                locked = false;
                isOuterLocked = false;
            }, duration );
        };
        self.release = function() {
            locked = false;
        };
        self.start = function(initDirection) {
            currentDirection = initDirection;
            setInterval(function() {
                if(queue != undefined && queue!= null && queue.length != 0) {
                    processQueue();
                }
            }, fadeRate+50);
        };
        /* Only accepts values of 'in' or 'out' */
        self.fade = function(direction) {
            if (!locked) {
                queue.push(direction);
            }
        };
        self.getQueue = function() {
            return queue;
        };
        self.getCurrentDirection = function() {
            return currentDirection;
        };
    };
    return FadeQueue;
});
