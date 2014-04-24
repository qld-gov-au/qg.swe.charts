/**
 * "Compact" base plugin (Unobtrusive DHTML clickey-hidey content sections)
 * jquery.compact.init.js
 * @version 3.5.2
 * Changelog:
 *   *  3.5.1 split from jquery.compact so it can be run after plugins are loaded
 *
 * @author Andrew Ramsden
 * @see http://irama.org/web/dhtml/compact/
 * @license GNU GENERAL PUBLIC LICENSE (GPL) <http://www.gnu.org/licenses/gpl.html>
 *
 * @requires jQuery (tested with 1.4.2) <http://jquery.com/>
 * @requires jQuery jARIA plugin <http://outstandingelephant.com/jaria/>
 *
 * @optional (but reccommended) jQuery ResizeEvents plugin <http://irama.org/web/dhtml/resize-events/>
 * @optional (but reccommended) jQuery Got Style? plugin <http://irama.org/web/dhtml/got-style/>
 * @optional (but reccommended) jQuery ARIA keyboard navigation plugin <http://irama.org/web/dhtml/aria/key-nav/>
 * @optional jQuery Cookies plugin <http://plugins.jquery.com/project/cookie>
 *
 */

/*globals ResizeEvents */
(function( $, ResizeEvents ) {// start closure
	'use strict';

	// On DOMLoad
	$(function() {

		// Initialise compact sections if not already initialised
		if ($.compact._conf.autoInitialise) {
			$('.'+$.compact._conf.compactClass)
				.not('.'+$.compact._conf.activeClass+', '+$.compact._conf.activeClasses)
					.compact();
		}
		// If ResizeEvents plugin is available, listen for resize events
		if (typeof ResizeEvents !== 'undefined') {
			$(this).each(function() {
				ResizeEvents.bind(
					'x-text-resize x-window-resize', // no need to catch 'x-initial-sizes', handled during init
					function() {
						// Give the browser a few ms to render the any new styles (for text size change)
						// then set the height of the .window element.
						window.setTimeout($.compact._handleResizeEvent, 20);
					}
				);
			});
		}
	});

}( jQuery, ResizeEvents )); /* end closure */
