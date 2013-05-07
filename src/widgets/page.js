/**
 * Author: Ralph Smith
 * Date: 4/24/12
 * Time: 11:43 AM
 * Description: Base page widget to handle prepending compiled micro
 *          templates on page load.
 */

define([
    'vendor/jquery',
    './widget',
    './../util/mouse'
], function($, Widget, Mouse) {
    return Widget.extend({
        create: function() {
            var self = this, $origNode;

            if (this.node.tagName.toLowerCase() !== 'body') {
                $origNode = this.$node.remove();
                this.$node = $('body');
                this.node = this.$node[0];
                this.$node.attr('id', $origNode.attr('id'));
            }

	    var hintCheckRate = 500;
	    this.mouse = new Mouse(); 
	    setInterval( self.checkWhetherToHint, hintCheckRate );

            self.load = $.Deferred();
            $(function() {
                self._prependTmpl();
                self.load.resolve();
            });
        },
        on: function(event, callback) {
            /* if the page is already loaded then just return
             * otherwise return a deferred object
             */
            var self = this;
            if (event === 'load' || event === 'loaded') {
                self.load.done(callback);
            } else {
                self._super.apply(arguments);
            }
        },
        _prependTmpl: function() {
            var self = this,
                template = self.options.template;

            if ($.isFunction(template)) {
                template = template();
            }

            if(template !== null) {
                $('body').prepend($(template));
		$('body').append( "<div class='more-document-hinting'></div>" );

		var windowAction = function() {
		    if( self.mouse.getPos().bottom < Number( $('div.more-document-hinting').height() ) ) {
			$('div.more-document-hinting').fadeOut(800);
		    }
		};
		
		self.mouse.updateCacheOnWindowEvents( {on: -1, off: 5}, 
						      [windowAction], [windowAction] );
		self.mouse.updateCacheOnHoverEvents( ['div.more-document-hinting'],
						     [{on: 2, off: -5}] );

		$(window).scroll( function() {
		    self.mouse.trap();
		    $('div.more-document-hinting').fadeOut(500);
		});
	    }
	},

	readViewPort: function() {
	    return {pxTop: $(window).scrollTop(), pxBottom: $(window).scrollTop() + $(window).height()};
	},
	isWindowCroppingDisplay: function() {
	    var hintShowHeight = 50;
	    var windowCroppingThreshold = hintShowHeight;
	    var vp = self.readViewPort();
	    return ( vp.pxBottom < $(document).height() - windowCroppingThreshold );
	},
	calcDistanceToBottom: function() {
	    var vp = this.readViewPort();
	    return $(document).height() - vp.pxBottom;
	},
	checkWhetherToHint: function() { 
	    var distanceToBottom = this.calcDistanceToBottom();
	    var $moreDocumentHinting = $('div.more-document-hinting');
	    var hintHeight = Number( $moreDocumentHinting.height() );
	    var mouseBottom = this.mouse.getPos().bottom;
	    var hintShowHeight = 50;
	    var fadeRate = 800;

	    if( distanceToBottom > hintShowHeight
		&& (mouseBottom > hintHeight || mouseBottom <= 0) ) {
		if( !this.mouse.isTrapped() ) {
		    $moreDocumentHinting.fadeIn(500);
		}
	    } else {
		if( !this.mouse.isTrapped() ) {
		    $moreDocumentHinting.fadeOut(500);
		}
	    }
	}
    });
});
