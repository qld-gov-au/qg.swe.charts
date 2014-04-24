/**
 * "Compact" base plugin (Unobtrusive DHTML clickey-hidey content sections)
 * jquery.compact.js
 * @version 3.5.2
 * Changelog:
 *   *  2.0 has been rewritten using jquery.
 *   *  2.5 includes ARIA roles, states and properties .
 *   *  3.0a includes improved ARIA keyboard nav, and removed dependency on large utilities file .
 *   *  3.0b separated to central core funtionality "compact" file.
 *   *  3.0 Added fullHeight plugin to measure the height of an element accurately (even if it is hidden)
 *   *  3.1 Added support for passing the type of compact plugin as an option, rather than setting as a class in the markup.
 *   *      Also, tweaks to slider, slideshow and tabbed plugins.
 *   *  3.2 Improvements to $.frag to support updating of hash value
 *   *  3.3 Added support for fieldset/legend combos. Also added support for content before and after tabbed sections (within compact container)
 *   *  3.4 Move UI button title attributes into link text (but visually hidden) so that all assistive technologies can successfully render the button label.
 *   *  3.5 Components updated: Slideshow 0.96, Slider 0.94, Tabbed 0.93, ARIA key nav 0.93, fixed behaviour of $.frag for Firefox.
 *   *  3.5.1 Slideshow 0.98
 *   *  3.5.2 split onready code into jquery.compact.init.js to run after plugins
 *
 * @author Andrew Ramsden
 * @see http://irama.org/web/dhtml/compact/
 * @license GNU GENERAL PUBLIC LICENSE (GPL) <http://www.gnu.org/licenses/gpl.html>
 *
 * @requires jQuery (tested with 1.4.2) <http://jquery.com/>
 * @requires jQuery jARIA plugin <http://outstandingelephant.com/jaria/>
 *
 * @optional (but reccommended) jQuery Got Style? plugin <http://irama.org/web/dhtml/got-style/>
 * @optional (but reccommended) jQuery ARIA keyboard navigation plugin <http://irama.org/web/dhtml/aria/key-nav/>
 * @optional jQuery Cookies plugin <http://plugins.jquery.com/project/cookie>
 *
 */

jQuery.compact = {};
jQuery.compact._conf = {
	autoInitialise : true,
	compactClass   : 'compact',
	activeClass    : 'active',
	activeClasses  : '.compact-slider-active, .compact-slideshow-active, .compact-tabbed-active, .choices' // other active classes (for benefit of IE6 that can't handle .slideshow.active selectors), and ignore .choices
};

(function( $ ) {// start closure
	'use strict';

	$.compact._handleResizeEvent = function () {
		// for (id in $.compact) {
		$.each( $.compact, function( id ) {
			// ignore internal functions/objects
			if (id.substr(0,1) === '_') { return true; }

			// all other objects are available plugins
			$.compact[id].handleResizeEvent();
		});
	};

	$.fn.compact = function (options) {
		options = options || {};
		$(this).each(function () {
			var $this = $( this );
			// for (id in $.compact) {
			$.each( $.compact, function( id ) {

				// ignore internal functions/objects
				if (id.substr(0,1) === '_') { return true; }

				// all other objects are available plugins
				if ($this.is($.compact[id].conf.containerSelector)) {
					$.compact[id].init( $this[ 0 ], options );
					return false; // break out of loop and anonymous function
				}
			});

			if (typeof options.type !== 'undefined' && options.type !== '') {
				if (typeof $.compact[options.type] !== 'undefined') {
					$.compact[options.type].init( $this[ 0 ], options );
					return; // break out of loop and anonymous function
				} else {
					// compact type not found
					$.debug('DEBUG: Compact plugin type not found for container element (with options.type of "'+options.type+'"). Make sure options.type is correct and the required plugin file has been included.');
					return; // break out of loop and anonymous function
				}
			} else if ( ! $(this).is( $.compact._conf.activeClasses )) {
				// compact type not found
				$.debug('DEBUG: Compact plugin type not found for container element (with class="'+$(this).attr('class')+'"). Make sure the required plugin file has been included.');
				return; // break out of loop and anonymous function
			}

		});

		return $(this); // facilitate chaining
	};

/**
 * Include some cut-back utilities here to avoid including all utilities.
 */
	/**
	 * Mimics the API of $.cookie plugin <http://plugins.jquery.com/project/cookie>
	 * Tests for the existence of the plugin and handles if not available.
	 *
	 * @example $.cookie('the_cookie', 'the_value');
	 * @desc Set the value of a cookie.
	 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
	 * @desc Create a cookie with all available options.
	 * @example $.cookie('the_cookie', 'the_value');
	 * @desc Create a session cookie.
	 * @example $.cookie('the_cookie', null);
	 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
	 *       used when the cookie was set.
	 *
	 * @param String name The name of the cookie.
	 * @param String value The value of the cookie.
	 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
	 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
	 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
	 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
	 *                             when the the browser exits.
	 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
	 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
	 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
	 *                        require a secure protocol (like HTTPS).
	 */
	$.compact._cookie = function (reference, /* optional */ value, /* optional */ options) {
		// is the cookie plugin available?

		if ($.cookie) {
			value = value || null;
			options = options || {};

			if (typeof reference === 'undefined') {
				$.debug('DEBUG: No reference was sent for call to $.compact._cookie()');
				return false;
			}

			if (value === null) {
				// getting cookie
				return $.cookie(reference);
			} else {
				// setting cookie
				return $.cookie(reference, value, options);
			}
		} else {
			$.debug('DEBUG: Cookie plugin not available to save state of compact section widgets.');
			return null;
		}
	};

	/**
	 * Get the the first and biggest heading inside the current element
	 * @version 3.2
	 * @author Andrew Ramsden <irama.org>
	 * @return jQueryNode The first and biggest heading within the target element,
	 *         or a blank h2 if no headings found.
	 */
	$.fn.firstHeading = function(includeAllDescendants) {
		includeAllDescendants = includeAllDescendants||false;

		// @since 3.0: Discovered that jQuery returns nodes in selector order, not DOM order,
		//             which means, this can all be shortened to one line...
		var heading, headingSelector = 'h1:first, h2:first, h3:first, h4:first, h5:first, h6:first';

		// @since 3.2: Support added for fieldset/legend combo
		if ($(this).get(0).tagName === 'FIELDSET') {
			headingSelector = 'legend:first, h1:first, h2:first, h3:first, h4:first, h5:first, h6:first';
		}

		// @since 3.1: Can specify whether to include all descendants (true) or just direct
		//             children headings (false).
		if (includeAllDescendants) {
			return (heading = $(this).find(headingSelector).eq(0)).text() !== '' ? heading : $('<h2></h2>');
		} else {
			return (heading = $(this).children(headingSelector).eq(0)).text() !== '' ? heading : $('<h2></h2>');
		}
	};

	/**
	 * A plugin to measure the height of an element accurately (even if it is hidden)
	 */
	$.fn.fullHeight = function () {
		var fullHeight;

		// if element is hidden, unhide it, then measure
		if ($(this).css('display') === 'none') {

			// make element display for a second
			$(this).css('display', 'block');

			// measure
			fullHeight = $(this).outerHeight({margin:true});

			// restore
			$(this).css('display', 'none');

		} else {
			fullHeight = $(this).outerHeight({margin:true});
		}

		return fullHeight;
	};

	/**
	 * A plugin to filter a nodeset to return only nodes that aren't display:none;
	 * this plugin is required because jQuery :visible doesn't return elements that
	 * are fading in (even though they are not display:none).
	 */
	$.fn.visible = function () {
		return $(this).filter(function(){
			return ($(this).css('display') === 'none')? false : true ;
		});
	};

	/**
	 * Gets and sets the anchor portion of the URL (after the #)
	 */
	$.frag = function (updatedFrag, jumpToFragment) {
		updatedFrag = updatedFrag || null;
		jumpToFragment = jumpToFragment || false;

		var currentX, currentY, currentFragment;

		if (updatedFrag !== null) {
			if (jumpToFragment) {
				window.location.hash = updatedFrag;
			} else if (($.browser.msie && $.browser.version <= 7) || ($.browser.mozilla && $.browser.version <= '2')) {
				// IE and Firefox don't deal with fragment changes correctly

				// get current scroll position
				currentY = $(window).scrollLeft();
				currentX = $(window).scrollTop();

				// Reset hash
				window.location.hash = updatedFrag;

				// Correct the scroll position
				$(window).scrollTop(currentX);
				$(window).scrollLeft(currentY);
			} else {
				// other modern browsers don't jump using the replace method
				window.location.replace('#'+updatedFrag);
			}
			return updatedFrag;
		} else {
			currentFragment = window.location.hash.replace('#','');
			return currentFragment;
		}
	};

}( jQuery )); /* end closure */
