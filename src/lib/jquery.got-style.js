/**
 * "Got style?" Some scripts are going to rely on the browser currently having CSS available and enabled.
 * This simple script will test if styles are supported on page load,
 * then makes the boolean result available via $.browser.gotStyle().
 *
 * jquery.got-style.js
 * @version 0.2
 * Changelog:
 *   *  0.1 Initial implementation
 *   *  0.2 Refactor: simplify style test
 *
 * @author Andrew Ramsden
 * @see http://irama.org/web/dhtml/got-style/
 * @license Common Public License Version 1.0 <http://www.opensource.org/licenses/cpl1.0.txt>
 * 
 * @requires jQuery (tested with 1.3.1) <http://jquery.com/>
 * 
 */
(function( $ ) {// start closure
	'use strict';


	var gotStyle = $( '<div />' ).css( 'width', '1px' ).width() === 1;


	/**
	 * @returns boolean Whether the browser has CSS available and enabled.
	 */
	$.browser.gotStyle = function() { return gotStyle; };


}( jQuery )); /* end closure */
