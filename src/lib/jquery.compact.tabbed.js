/**
 * "Tabbed content" (compact tabbed content sections)
 * jquery.compact.tabbed.js
 * @version 0.96
 * Changelog:
 *   * 2.0 has been rewritten using jquery.
 *   * 2.5 includes ARIA roles, states and properties .
 *   * 2.6 includes improved ARIA keyboard nav, and removed dependency on large utilities file .
 *   * 0.1 reset version number - separated from central compact file into own plugin file.
 *   * 0.6 animation of transition between tabs added. Added option to control whether current state is saved in cookie or not.
 *   * 0.7 new option added controlsPosition, to allow controls to be inserted after content (or before).
 *   * 0.8 when using variableHeight mode, height is set to auto after animation to allow for automatic resizing.
 *   * 0.9 improved ARIA roles, states and properties (now treated as a live region).
 *   * 0.91 By default, selecting a tab now updates the URL fragment id. Also, when a user sets the fragment id in the URL, if it matches a tabbed section, this section will be expanded on load.
 *   * 0.92 now supports content before and after tabbed sections (within compact container)
 *   * 0.93 Now has own unique 'active' class so IE6 doesn't get confused when styling active state.
 *   * 0.94 Now creates a unique id for container (instead of complaining about it not being there).
 *   * 0.95 tweaks to optimise and pass jslint; store data as 'compact tabbed' (not 'options') (bboyle)
 *   * 0.96 Now self-aware of when tabs wrap (sets a class) so that tabs can be styled differently.
 *
 * @author Andrew Ramsden <http://irama.org/>
 * @see http://irama.org/web/dhtml/compact/tabbed/
 * @license GNU GENERAL PUBLIC LICENSE (GPL) <http://www.gnu.org/licenses/gpl.html>
 * 
 * @requires jQuery (tested with 1.4.2) <http://jquery.com/>
 * @requires jQuery jARIA plugin <http://outstandingelephant.com/jaria/>
 * @requires jQuery Compact base plugin <http://irama.org/web/dhtml/compact/>
 * 
 * @optional (but reccommended) jQuery ResizeEvents plugin <http://irama.org/web/dhtml/resize-events/>
 * @optional (but reccommended) jQuery Got Style? plugin <http://irama.org/web/dhtml/got-style/>
 * @optional (but reccommended) jQuery ARIA keyboard navigation plugin <http://irama.org/web/dhtml/aria/key-nav/>
 * @optional jQuery Cookies plugin <http://plugins.jquery.com/project/cookie>
 *
 * Notes:
 *    * The selector can be changed to target whichever element contains all of the 
 *      collapsable content sections.
 *    * Each section within MUST have a unique id.
 */

if ( typeof jQuery.compact === 'undefined' ) {
	jQuery.compact = {};
}
jQuery.compact.tabbed = {};


/**
 * Default options, these can be overridden for each call to compactTabbed
 */
jQuery.compact.tabbed.defaultOptions = {
	type                  : 'tabbed',
	variableHeight        : false, // if set to true, height will animate based on content of current panel. If set to false, height of largest section will be set on load (relies on setting a height attribute for all content images in img tag markup).	
	transitionSpeed       : 'fast', // 'slow', 'def' or 'fast'
	heightAdjustSpeed     : 'def',
	rememberStateInCookie : true, // if cookie plugin is available the last focussed tab will be remembered
	controlsPosition      : 'before', // Controls (tabs) are inserted before or after content 'before' (default) or 'after'
	cookieExpiryDays      : 30
};


/**
 * Global configuration (these apply to every instance of compactTabbed, etc...)
 * Adjust to suit your preferred markup.
 */
jQuery.compact.tabbed.conf = {
	containerSelector    : '.' + $.compact._conf.compactClass + '.tabbed',
	activeClass          : 'compact-tabbed-active',
	cookieRefPrefix      : 'c.tabbed#',
	viewportElClass      : 'viewport',
	viewportInnerElClass : 'viewport-inner', // extra div used for styling
	sectionClass         : 'section',
	headingClass         : 'heading',
	contentClass         : 'content',
	buttonClass          : 'button',
	closedClass          : 'closed',
	openClass            : 'open',
	currentClass         : 'current',
	narrowClass          : 'narrow',
	narrowMenuClass      : 'show',
	updateURL            : false, // Update the fragment id at the end of the URL
	updateURLForIE6_7    : false // IE 6 and 7 will flicker when URL hash is updated
};


(function( $ ) {// start closure
	'use strict';

	// functions
	var initCompactTabbed, initialiseSectionState, checkTabLayoutSpace, adjustTabbedViewportHeight, activateTab, tabNavigationEv, getTallestTabbedSection,
		expandSection, collapseSection, activateSection, setCurrentTab;


	$.compact.tabbed.initialised = [];
	$.compact.tabbed.counter = 0;


	$.fn.compactTabbed = function( options ) {
		options = options || {};
		
		this.each(function () {
			initCompactTabbed.apply(this, [ options ]);
		});
		
		return this; // facilitate chaining
	};


	$.compact.tabbed.init = function( containerEl, options ) {
		options = options || {};
		initCompactTabbed.apply( containerEl, [ options ]);
	};
	
	
	$.compact.tabbed.handleResizeEvent = function() {
		var n;

		for ( n = 0; n < $.compact.tabbed.initialised.length; n++ ) {
			// Check if tabs wrap over more than one line
			checkTabLayoutSpace('#'+$.compact.tabbed.initialised[n]);
			// Check tab viewport heights are still ok
			adjustTabbedViewportHeight( '#' + $.compact.tabbed.initialised[ n ]);
		}
	};
	
	
	initCompactTabbed = function( options ) {
		var $this = $( this ),
			updateURL,
			tabGroup, tabList, viewport, viewPortInner,
			firstTab, savedTabId,
			preContent, allSections, otherContent,
			matchedFragId,
			firstOpenSection, defaultSection
		;
		
		// is CSS supported? (if gotStyle plugin is not avialable, assume it is supported).
		if ( typeof $.browser.gotStyle !== 'undefined' && $.browser.gotStyle( this ) === false ) {
			$.debug( 'DEBUG: Your browser does not have CSS support available or enabled, tabbed script exiting' );
			return;
		}

		// must have a unique id
		$this.generateId( 'compact-tabbed' );

		if ( ! $this.is( $.compact.tabbed.conf.containerSelector )) {
			// add the appropriate classes
			$this.addClass( $.compact.tabbed.conf.containerSelector.split( '.' ).join( ' ' ));
		}
		
		// Work out whether the URL should be updated
		if ( $.browser.msie && $.browser.version <=7 ) {
			updateURL = !! $.compact.tabbed.conf.updateURLForIE6_7;
		} else {
			updateURL = !! $.compact.tabbed.conf.updateURL;
		}
	
		// Merge runtime options with defaults
		// Note: The first argument sent to extend is an empty object to
		// prevent extend from overriding the default $.AKN.defaultOptions object.
		options = ( typeof options === 'undefined' ) ? $.compact.tabbed.defaultOptions : $.extend( {}, $.compact.tabbed.defaultOptions, options );
		options.updateURL = updateURL;
		$this
			.data( 'compact-tabbed', options )
			.ariaState( 'live','assertive' ) // All changes occur due to user-initiated actions, and are expected, be assertive!
		;

		// setup tabs
		tabGroup = this;
		tabList = $( '<ul class="nl tabs"></ul>' );
		tabList.delegate( 'a', 'click', activateTab );
		viewport = $( '<div class="' + $.compact.tabbed.conf.viewportElClass + '"><div class="' + $.compact.tabbed.conf.viewportInnerElClass + '"></div></div>' );
		viewPortInner = viewport.find( '.' + $.compact.tabbed.conf.viewportInnerElClass );
			
		//viewport.css('overflow','auto');
		//viewPortInner.css('overflow','auto');
			
		firstTab = null;
		if ( options.rememberStateInCookie ) {
			savedTabId = $.compact._cookie( $.compact.tabbed.conf.cookieRefPrefix+ $this.attr( 'id' ) + '.current' );
		} else {
			savedTabId = null;
		}
			
		// ensure content remains in correct order
		// get content before sections
		preContent = $( tabGroup ).children( '.' + $.compact.tabbed.conf.sectionClass ).eq( 0 ).prevAll();
		// get all sections
		allSections = $( tabGroup ).children( '.' + $.compact.tabbed.conf.sectionClass );
		// get all other content (will be pushed after tabbed sections)
		otherContent = $( tabGroup ).children().not( preContent ).not( allSections );

		// check for matching frag id
		matchedFragId = $.frag();
		if ( matchedFragId === '' || allSections.filter( document.getElementById( $.frag() )).length === 0 ) {
			matchedFragId = null;
		}

		viewPortInner.append( allSections );
		// preContent will end up on top
		$( tabGroup )
			.append( viewport )
			.append( otherContent )
		;

		// if open class is set, this section should be the default section (unless another state is set in cookie).
		firstOpenSection = allSections.filter( '.' + $.compact.tabbed.conf.openClass ).eq( 0 );
		defaultSection = ( firstOpenSection.length > 0 ) ? firstOpenSection.attr( 'id' ) : null;

		// for each section... applied to each '.section' in this 'div.compact.tabbed' group
		allSections.each(function() {
			var section = $( this ),
				id, buttonId,
				heading, hText,
				listItem,
				tempContent, tempContainer
			;
				
			// make sure section has an id
			if( this.id === '' ) {
				$.debug( 'DEBUG: Each tabbed section must have an unique id' );
				section.addClass( 'error' );
				return false;
			}
			id = this.id;

			// Get the the first and biggest heading for the link text
			heading = section.firstHeading( true );
			heading.addClass( $.compact.tabbed.conf.headingClass );
			hText = heading.text();
			
			// add to tab list
			listItem = $( '<li><a href="#' + id + '"><span>' + hText + '</span></a></li>' );
			buttonId = listItem.find( 'a' ).generateId( id + '-' + $.compact.tabbed.conf.buttonClass ).attr( 'id' );

			listItem.find( 'a' )
				// .click( activateTab )
				.ariaState( 'pressed', 'false' )
			;
			tabList.append( listItem );
			
			// wrap content
			tempContent = section.children().not( heading );
			tempContent.remove();
			tempContainer = $( '<div class="' + $.compact.tabbed.conf.contentClass + '"></div>' );

			tempContainer
				.generateId( id + '-' + $.compact.tabbed.conf.contentClass )
				.append( tempContent )
				//.css('overflow','auto')
				.ariaRole( 'tabpanel' )
				.ariaState({
					hidden     : 'true',
					expanded   : 'false',
					labelledby : buttonId,
					atomic     : 'true' // each section can be considered atomic (label should also be presented with changes)
				})
			;
			section.append( tempContainer );
			
			// open or close tab
			if ( matchedFragId !== null ) {
				// fragment ID from URL matches a section
				initialiseSectionState.apply( this, [ matchedFragId, listItem, tabGroup ]);
			} else if ( savedTabId !== null && document.getElementById( savedTabId ) !== null ) {
				// last tab is available from cookie
				//$.debug('DEBUG: jQuery(#' + savedTabId + ').length ' + ($('#' + savedTabId).length));
				initialiseSectionState.apply( this, [ savedTabId, listItem, tabGroup ]);
			} else if ( defaultSection !== null ) {
				// default (open) section was found in HTML
				initialiseSectionState.apply( this,[ defaultSection, listItem, tabGroup ]);
			} else {
				// set first tab as current
				if ( firstTab === null ) {
				// force init and expand
					initialiseSectionState.apply( this, [ section.attr( 'id' ), listItem, tabGroup ]);
				} else {
				// force init and collapse 
					initialiseSectionState.apply(this, [ firstTab, listItem, tabGroup ]);
				}
			}
			
			if ( firstTab === null ) {
				firstTab = this;
			}
		});

		// if ARIA keyboard nav plugin is available, use it
		if ( $.fn.managefocus ) {
			tabList
				.managefocus(
					'a',
					{
						role        : 'tablist',
						ignoreKeys  : [ 38,40 ],
						keyHandlers : {
							//38 : function(ev){ev.preventDefault();}, // prevent window scrolling up
							38 : tabNavigationEv, // up key will open tab
							40 : tabNavigationEv // down key will open tab
						}
					}
				)
				.controls( tabGroup )
			;
		}
		
		if ( options.controlsPosition === 'before' ) {
			//$(tabGroup).prepend(tabList);
			viewport.eq( 0 ).before( tabList );
		} else {
			$( tabGroup ).append( tabList );
		}

		// Add active class
		$this.addClass( $.compact.tabbed.conf.activeClass );
		$.compact.tabbed.initialised.push( $this.attr( 'id' ));

		// now active styles are applied, if container should have static height...
		if ( ! options.variableHeight ) {
			// static height
			// find height of tallest tab, set to that height
			viewPortInner.height( getTallestTabbedSection( this ));
			$this.trigger( 'x-height-change' );
		}
		
		checkTabLayoutSpace('#'+$(this).attr('id'));
		
		return;
	};


	initialiseSectionState = function( expandThisSectionId, listItem, tabGroup ) {
		var $this = $( this );

		if ( $this.attr('id') === expandThisSectionId ) {
			expandSection.apply( this );
			listItem.addClass( $.compact.tabbed.conf.currentClass );
			$( tabGroup ).addClass( $.compact.tabbed.conf.currentClass + '-' + $this.attr( 'id' ));
			// initial active tab
			$this.trigger( 'tabactive' );
		} else {
			collapseSection.apply( this );
			$this.hide();
			listItem.removeClass( $.compact.tabbed.conf.currentClass );
		}
	};
	

	/**
	 * When the width of the container this widget sits within is narrow enough
	 * that the tabs wrap onto more than one line, set a class on the widget
	 * such that the tabs can be styled differently.
	 * @since 0.95
	 */
	checkTabLayoutSpace = function (tabbedContainerSelector) {
		var containerEl = $(tabbedContainerSelector),
			toggle = containerEl.find( '.' + $.compact.tabbed.conf.narrowClass ),
			tabs = $( '.tabs li a', containerEl ).not( toggle ),
			tabsWrapped
		;

		// are the first and last tabs on different lines?
		containerEl.removeClass( $.compact.tabbed.conf.narrowClass );
		tabsWrapped = tabs.eq( 0 ).offset().top < tabs.eq( -1 ).offset().top;
		containerEl.toggleClass( $.compact.tabbed.conf.narrowClass, tabsWrapped );

		if ( tabsWrapped ) {
			// prevent duplicate tabs
			if ( toggle.length === 0 ) {
				containerEl.find( '.tabs' ).append( '<li class="' + $.compact.tabbed.conf.narrowClass + '"><a href="#' + containerEl.generateId()[ 0 ].id + '">…</a></li>' );
			}
		} else {
			toggle.remove();
		}
	};


	adjustTabbedViewportHeight = function( tabbedContainerSelector ) {
		// init
		var containerEl = $(tabbedContainerSelector),
			options = containerEl.data( 'compact-tabbed' ),
			viewportEl
		;
		if ( ! options.variableHeight ) {
			// static height
			// find height of tallest tab, animate to that height
			viewportEl = $( containerEl ).find( '.' + $.compact.tabbed.conf.viewportInnerElClass ).eq( 0 );
			viewportEl.stop().animate({ 'height': getTallestTabbedSection( containerEl )}, options.heightAdjustSpeed, function() {
				$( this ).trigger( 'x-height-change' );
			});
		}
	};


	getTallestTabbedSection = function( containerEl ) {
		//return 50;
		var heights = $.map( $( containerEl ).find( '.' + $.compact.tabbed.conf.sectionClass ), function( element ) {
			return $( element ).fullHeight();
		});
		return Math.max.apply( Math, heights );
	};


	tabNavigationEv = function( eventObj ) {
		activateTab.apply( this );
		eventObj.preventDefault();
		return false;
	};


	expandSection = function() {
		$( this )
			.removeClass( $.compact.tabbed.conf.closedClass )
			.addClass( $.compact.tabbed.conf.openClass )
			.ariaState({
				hidden : 'false',
				expanded : 'true'
			})
		;
	};


	collapseSection = function() {
		$( this )
			.removeClass( $.compact.tabbed.conf.openClass )
			.addClass( $.compact.tabbed.conf.closedClass )
			.ariaState({
				hidden : 'true',
				expanded : 'false'
			})
		;
	};


	function activateSectionById( sectionId ) {
		return $( $.compact.tabbed.conf.containerSelector + ' #' + sectionId ).each( activateSection );
	}


	activateSection = function() {
		// init
		var $this = $( this ),
			containerEl = $this.parents( $.compact.tabbed.conf.containerSelector ).eq( 0 ),
			options = containerEl.data( 'compact-tabbed' ),
			viewportEl = $this.parents( '.' + $.compact.tabbed.conf.viewportInnerElClass ).eq( 0 ),
			newTab = $this,
			previousTab = $this.siblings( '.' + $.compact.tabbed.conf.openClass ) //'.'+$.compact.tabbed.conf.sectionClass+
		;

		// remove previously "current" class, add new "current class"
		containerEl
			.removeClass( $.compact.tabbed.conf.currentClass + '-' + previousTab.attr( 'id' ))
			.addClass( $.compact.tabbed.conf.currentClass  +'-' + newTab.attr( 'id' ))
		;

		// collapse open tab
		containerEl.ariaState( 'busy', 'true' );
		collapseSection.apply( previousTab );
		previousTab.fadeOut( options.transitionSpeed, function() {
			var containerEl = $( this ).parents( $.compact.tabbed.conf.containerSelector ).eq( 0 ),
				options = containerEl.data( 'compact-tabbed' )
			;
				
			// after fading out previous tab, expand newTab
			expandSection.apply( newTab );
			newTab.fadeIn( options.transitionSpeed );
			containerEl
				.ariaState( 'relevant','all' ) // content was hidden, other content was revealed
				.ariaState( 'busy','false' )
			;
		});

		// check height if container should have variable height
		if ( options.variableHeight && previousTab.fullHeight() !== newTab.fullHeight() ) {
			// animate the height difference
			viewportEl.stop().animate({ 'height': $this.fullHeight() }, options.heightAdjustSpeed, '', function() {
				// after animation, set height to auto
				viewportEl.css( 'height','auto' );
				$( this ).trigger( 'x-height-change' );
			});
		}
		$( this ).trigger( 'tabactive' );

		// set cookie
		if ( options.rememberStateInCookie ) {	
			$.compact._cookie(
				$.compact.tabbed.conf.cookieRefPrefix + containerEl.attr( 'id' ) + '.current',
				$this.attr( 'id' ),
				{ expires : options.cookieExpiryDays }
			);
		}

		// update the URL
		if ( options.updateURL ) {
			$.frag( $this.attr( 'id' ), false );
		}
		// update tab status
		$( 'a[href$="#' + $this.attr( 'id' ) + '"]' ).each( setCurrentTab );
		return;
	};


	activateTab = function() {
		// activate matching section, strip hash from href to get correct id
		var tab = $( this ).parent(),
			href = $( this ).attr( 'href' );

		// skip … affordance for displaying narrow tabs
		if ( ! tab.hasClass( $.compact.tabbed.conf.narrowClass )) {
			activateSectionById( href.replace( /^.*#/, '' ));
			setCurrentTab.apply( this );
		}

		// if narrow, toggle visibility of tabs
		if ( tab.closest( '.tabbed' ).hasClass( $.compact.tabbed.conf.narrowClass )) {
			tab.parent().children( 'li' ).toggleClass( $.compact.tabbed.conf.narrowMenuClass );
		}

		return false; // so anchor href isn't followed
	};


	setCurrentTab = function() {
		var parent = $( this ).parent();
		
		parent.siblings()
			.removeClass( $.compact.tabbed.conf.currentClass )
			.find( 'a' ).ariaState( 'pressed', 'false' )
		;
		parent
			.addClass( $.compact.tabbed.conf.currentClass )
			.find( 'a' ).ariaState( 'pressed', 'true' )
		;
	};


}( jQuery )); /* end closure */
