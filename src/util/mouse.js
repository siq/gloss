define([
    'vendor/jquery',
    'vendor/underscore'
], function($, _) {
    // Two bugs when used in page.js
    // 1) Leaving the scroll bar after use only occasionally allows a fadeIn effect...
    //    Perhaps mouse is getting released through a window.enter event and a fadeIn is triggered...?
    // 2) Enter the window through hinting only usually allows a fadeOut->fadeIn
    //    Race conditions between the a fadeOut trigger and a fadeIn interval poll?
    var Mouse = function() {
	var self = this;
	var top;
	var bottom;
	var trapped = false;

	self.trap = function() {
	    trapped = true;
	};
	self.release = function() {
	    trapped = false;
	};
	self.isTrapped = function() {
	    return trapped;
	};
	var cacheMousePos = function(event, delta) {
	    top = event.pageY - $(window).scrollTop(); 
	    if( delta != undefined ) {
		top += delta;
	    }
	    bottom = $(window).height() - top;
	};
	/* Store a position on construction, (nonsense state in more cases)
	 * Kludge to prevent cursor-off-window-on-instantiation weirdness */
	(function() {
	    top = 0;
	    bottom = $(window).height();
	})();

	self.updateCacheOnWindowEvents = function(allowances, entryActions, exitActions) {
	    $(document).mouseenter( function(evt) {
		cacheMousePos( evt, allowances.on );
		_.each( entryActions,
			function(action) {
			    self.trap();
			    action();
			    self.release();
			});

	    });
	    $(document).mouseleave( function(evt) {
		cacheMousePos( evt, allowances.off );
		_.each( exitActions,
			function(action) {
			    self.trap();
			    action();
			    self.release();
			});
	    });
	};
	self.updateCacheOnHoverEvents = function(selectors, allowances) {
	    _.each( selectors,
		    function(selector, i) {
			$(selector).hover(
			    function(evt) {
				cacheMousePos( evt, allowances[i].on );
			    }, function(evt) {
				cacheMousePos( evt, allowances[i].off );
			    });
		    });
	};

	self.getPos = function() {
	    return {top: top, bottom: bottom};
	};
    };
    return Mouse;
});

