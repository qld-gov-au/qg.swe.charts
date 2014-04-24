/*global qg, markdown */
(function( $, swe ) {
	'use strict';


	function pad( s, length, padding ) {
		s = String( s );
		while ( s.length < length ) {
			s = padding + s;
		}
		return s;
	}


	function qgovTimeFormat( date ) {
		var hours = date.getHours();
		return ( hours === 0 ? '12' : ( hours % 12 )) + '.' + pad( date.getMinutes(), 2, '0' ) + ( hours < 12 ? 'am' : 'pm' );
	}


	swe.template = {};

	// clean text before updating html
	swe.template.clean = function( text ) {
		return $( '<div/>' ).text( text ).html().replace( /"/g, '&quot;' );
	};


	// format text
	swe.template.format = function( text, format, options ) {
		options = $.extend( {}, options );
		var value, actual;

		if ( text === null ) {
			return '';
		}

		switch ( format ) {
		case '%':
			return Math.round( parseFloat( text )) + '%';

		case '$':
			value = parseFloat( text );
			if ( value >= 10000 ) {
				actual = text.replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' );
				if ( value < 1000000 ) {
					// thousands
					return '$' + actual;

				} else {
					// millions
					actual = text.replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' );
					text = String( Math.round( text / 100000 ) / 10 ) + '\xA0million';

					switch ( options.abbr ) {
					case true:
						return '<abbr title="$' + actual + '">$' + text + '</abbr>';
					case 'both':
						return '$' + text + ' ($' + actual + ')';
					}
				}
			}
			return '$' + text;

		case 'md':
			return markdown.toHTML( text );

		case 'date':
		case 'datetime':
			if ( typeof text === 'string' ) {
				value = new Date( text );
				if ( isNaN( value.getTime() )) {
					// assume ISO format: YYYY-MM-DD
					actual = text.split( /[-:T ]/ );
					value = new Date( actual[ 0 ], parseInt( actual[ 1 ], 10 ) - 1, actual[ 2 ] );
					if ( isNaN( value.getTime() )) {
						return text;
					}
					// optional time component
					if ( actual.length > 3 ) {
						value.setHours( actual[ 3 ] );
						if ( actual.length > 4 ) {
							value.setMinutes( actual[ 4 ] );
							if ( actual.length > 5 ) {
								value.setSeconds( actual[ 5 ] );
							}
						}
					}
				}
			} else {
				// assume date object
				value = text;
			}

			text = value.getDate() + ' ' + 'January,February,March,April,May,June,July,August,September,October,November,December'.split( ',' )[ value.getMonth() ] + ' ' + value.getFullYear();

			if ( format === 'datetime' ) {
				// format time component
				text += ', ' + qgovTimeFormat( value );
			}

			return text;

		case 'abn':
			return String( text ).replace( /\s+/g, '' ).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1\xA0' );
		}
		// default
		return swe.template.clean( text );
	};


	// simple templates
	swe.template.process = function( template, data ) {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter
		return template.replace( /\{\{(.*?)\}\}/g, function( matched, key ) {
			var keys = key.split( /[:|]/ ),
			    value = ''
			;

			if ( keys.length > 1 ) {
				key = keys[ 1 ];
			}

			// check we have the data
			if ( typeof data !== 'object' || typeof data[ key ] === 'undefined' ) {
				return matched;
			}

			// plain text data
			if ( keys.length === 1 ) {
				return swe.template.clean( data[ key ] );
			}

			// handle syntax: type:key|pipeType:pipeValue
			switch( keys[ 0 ] ) {
			// parse plain text from markdown
			case 'text':
				value = $( markdown.toHTML( data[ key ] )).text();
				break;

			// compare 2 values
			case 'compare':
				if ( keys.length < 3 || typeof data[ keys[ 2 ]] === 'undefined' || data[ keys[ 2 ]] === null || data[ keys[ 2 ]].length === 0 ) {
					value = markdown.toHTML( data[ key ] );
				} else {
					value =
					  '<div class="section comparison advantage comparison-first"><div class="comparison-inner">' +
					  markdown.toHTML( data[ key ] ) +'</div></div>' +
					  '<div class="section comparison disadvantage comparison-last"><div class="comparison-inner">' +
					  markdown.toHTML( data[ keys[ 2 ]] ) + '</div></div>';
				}
				break;

			// use format
			default:
				value = swe.template.format( data[ key ], keys[ 0 ] );
			}

			// piping
			if ( keys.length === 4 ) {
				(function() {
					// assume keys[ 2 ] === 'words'
					var words = value.split( /\s+/ ),
					    count = parseInt( keys[ 3 ], 10 )
					;

					// if longer than word count
					if ( words.length > count ) {
						// truncate it
						value = words.slice( 0, count ).join( ' ' ) + '…';
					}
				}());
			}

			return value;
		});
	};


}( jQuery, qg.swe ));
