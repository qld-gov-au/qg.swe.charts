/*globals qg*/
(function( $, qg ) {
	'use strict';

	// assume: qg.swe, qg.data.get

	// add data to a page as text, a list or chart
	qg.swe.loaded( 'data', function( config ) {
		config = $.extend({
			title: 'Data',
			headings: [],
			rowHeadings: true,
			group: 'col', // note: anything other than 'row' becomes col anyway
			formats: {},
			type: 'bar',
			legend: true,
			supplementary: [],
			colours: [ '#313695', '#4575B4', '#74ADD1', '#ABD9E9', '#FEE090', '#FDAE61', '#F46D43', '#D73027', '#A50026' ],
			delimiter: ', '
		}, config );

		var callback = {};


		// colour keywords
		if ( typeof config.colours === 'string' ) {
			switch ( config.colours.toLowerCase() ) {
			case 'rag':
				config.colours = [ '#d80000', '#ffb400', '#007c00' ];
				break;

			case 'priority':
				config.colours = [ '#F46D43', '#FDAE61', '#313695', '#ABD9E9' ];
				break;

			case 'initiatives':
				config.colours = [ '#313695' ];
				break;
			}
		}

		
		callback.text = function( data ) {
			var container = $( document.getElementById( config.container ));
			// check container exists
			if ( container.length === 0 ) {
				$.debug( 'Element not found for data', config.container );
				return;
			}

			// add data to page
			if ( data.result.records.length > 0 ) {
				container.html(
					$.map( data.result.records, function( record ) {
						record = $.map( record, function( value, key ) {
							return qg.swe.template.format( value, config.formats[ key ] );
						}).join( config.delimiter );
						return record;
					}).join( '\n' )
				);
			}
			// trigger SWE layout reflow
			container.trigger( 'x-height-change' );
		};


		callback.ul = function( data ) {
			var container = $( document.getElementById( config.container ));

			// check container exists
			if ( container.length === 0 ) {
				$.debug( 'Element not found for data', config.container );
				return;
			}

			// add data to page
			if ( data.result.records.length > 0 ) {
				container.html(
					'<ul class="data">' +
						$.map( data.result.records, function( record ) {
							record = $.map( record, function( value, key ) {
								return qg.swe.template.format( value, config.formats[ key ] );
							}).join( config.delimiter );
							return '<li>' + qg.swe.template.clean( record ) + '</li>';
						}).join( '\n' ) +
					'</ul>'
				);
			}
			// trigger SWE layout reflow
			container.trigger( 'x-height-change' );
		};


		callback.dl = function( data ) {
			var container = $( document.getElementById( config.container ));

			// check container exists
			if ( container.length === 0 ) {
				$.debug( 'Element not found for chart', config.container );
				return;
			}

			// add data table to page
			var hideClass = '',
			    rowCount = 0
			;

			container.html( '<p class="total-search-count">Displaying ' + data.result.records.length + ' search results</p>' +
				$.map( data.result.records, function( rowData, dlHeading ) {
					rowCount++;
					rowData = $.map( config.headings, function( key, i ) {

						hideClass = $.inArray( key, config.supplementary ) > -1 ?  ' class="supplementary"' : '';
						if (i !== 0 ) {
							return '<dt' + hideClass + '>' + config.headings[ i ] + '</dt><dd' + hideClass + '>' + qg.swe.template.format( rowData[ key ], config.formats[ key ], { abbr: 'both' } ) + '</dd>';
						} else {
							dlHeading = '<h3>' + qg.swe.template.format( rowData[ key ], config.formats[ key ], { abbr: 'both' } ) + '</h3>';
						}
					});
					return '<div id="rs' + rowCount + '">' + dlHeading + '<dl>' + rowData.join( '' ) + '</dl></div>' +
					       ( config.supplementary.length > 0 ? '<a class="more" href="#rs' + rowCount + '">Show more…</a>' : '' );
				}).join( '' )
			);

			// setup lightbox
			$( 'a.more', container ).butterfly();

			// trigger SWE layout reflow
			container.trigger( 'x-height-change' );
		};


		callback.chart = function( data ) {
			var container = $( document.getElementById( config.container )),
				even = true,
				table, w, h, rows, cols,
				chart, series, grid, xaxis, yaxis, legend
			;

			// check container exists
			if ( container.length === 0 ) {
				$.debug( 'Element not found for chart', config.container );
				return;
			}

			// add data table to page
			container.html(
				'<table class="chart">' +
					'<caption>' + qg.swe.template.clean( config.title ) + '</caption>' +
					'<thead>' + $.map( config.headings, function( h ) { return '<th scope="col">' + qg.swe.template.clean( h ) + '</th>'; } ).join( '' ) + '</thead>' +
					'<tbody>' +
					$.map( data.result.records, function( rowData ) {
						var tagName;
						rowData = $.map( config.headings.slice( 0 ), function( key, i ) {
							tagName = config.rowHeadings && i === 0 ? 'th' : 'td';
							return '<' + tagName + ( tagName === 'th' ? ' scope="row"' : '' ) + '>' +
								   qg.swe.template.format( rowData[ key ], config.formats[ key ] ) + '</' + tagName + '>';
						});
						return '<tr' + (( even = ! even ) ? ' class="even"' : '' ) + '>' + rowData.join( '' ) + '</tr>';
					}).join( '' ) +
					'</tbody>' +
				'</table>'
			);

			// put table into a tab section
			table = container.find( 'table' );
			table.wrap( '<div class="section"/>' ).before( '<h2>Table</h2>' );
			table.parent().generateId( config.container + '-table' );
			// get height (this won't change inside tabs)
			// min height of 250px (pie charts broken in FF at 140px height)
			h = Math.max( table.height(), 250 );
			// don't get width here, padding inside tabs will reduce it

			// chart section
			chart = $( '<div class="section"><h2>Chart</h2></div>' )
				.generateId( config.container + '-chart' )
				.prependTo( container )
			;
			// chart container (within chart section)
			chart = $( '<div/>' ).appendTo( chart );

			// initialise tabs (this is so chart size will be correct)
			container.compact({
				type: 'tabbed',
				variableHeight: true,
				rememberStateInCookie: false
			});

			// get width within tabs
			w = chart.width();
			// set height (required for flot)
			chart.height( h );
			rows = $( 'tbody tr', table ).length;
			cols = $( 'tbody tr', table ).eq( 0 ).find( 'td' ).length; // don't count th

			// TODO make this a plugin that can run on any existing HTML table

			// prep data for chart
			xaxis = {};
			yaxis = {
				tickDecimals: 0,
				max: 1
			};

			// this code works for:
			// - column headings = legend
			// - row headings = xaxis (groups of bars)
			data = $.map( $( 'tbody tr', table ), function( tr ) {
				return [ $.map( $( 'th, td', tr ), function( td ) {
					td = $( td );
					var text = td.text();
					if ( td.is( 'td' )) {
						text = parseFloat( text.replace( /[^0-9\.]+/g, '' ));
					}
					return text;
				})];
			});
			// console.log( 'table data', data );

			switch ( config.type ) {
			case 'line':
				// grouping data
				if ( config.group !== 'row' ) {
					// [ a, b, c ] => { label: a, data: [[ x1, b ], [ x2, c ]] }
					data = $.map( data, function( d ) {
						return {
							label: d.shift(),
							data: $.map( d, function( value, col ) {
								if ( value > yaxis.max ) {
									yaxis.max = value;
								}
								return [[ col, value ]];
							})
						};
					});
					// col headings = x axis labels
					xaxis = {
						tickColor: '#EFEDEE',
						autoscaleMargin: 0.02, // allow space left and right
						ticks: $.map( $( 'thead th', table ).slice( 1 ), function( th, col ) {
							return [[ col, $( th ).text() ]];
						})
					};

				} else {
					// group by row
					// row 1 = [ th, a, b ] -> { label: thead > th, data: [[ x1, a ], [ x2, m ], [ x3, x ]] }
					// row 2 = [ th, m, n ]
					// row 3 = [ th, x, y ]
					// note: assume row headings
					data = $.map( data[ 0 ].slice( 1 ), function( d, col ) {
						return {
							label: $( 'thead th', table ).eq( col + 1 ).text(),
							data: $.map( data, function( rowData, row ) {
								var value = rowData[ col + 1 ];
								if ( value > yaxis.max ) {
									yaxis.max = value;
								}
								return [[ row, value ]];
							})
						};
					});
					// row headings = x axis labels
					xaxis = {
						tickColor: '#EFEDEE',
						labelWidth: 10,
						autoscaleMargin: 0.02, // allow space left and right
						ticks: $.map( $( 'tbody th', table ), function( th, row ) {
							return [[ row, $( th ).text() ]];
						})
					};
				}
				series = {
					lines: {
						show: true,
						lineWidth: 1
					},
					points: { show: false }
				};
				legend = { show: !! config.legend };
				if ( typeof config.legend === 'string' && $( config.legend ).length > 0 ) {
					legend.container = config.legend;
				}
				break;

			case 'bar':
				// grouping data
				if ( config.group !== 'row' ) {
					// [ a, b, c ] => { label: a, data: [[ x1, b ], [ x2, c ]] }
					data = $.map( data, function( d, row ) {
						return {
							label: d.shift(),
							data: $.map( d, function( value, col ) {
								if ( value > yaxis.max ) {
									yaxis.max = value;
								}
								return [[ row + ( col * ( rows + 1 )), value ]];
							})
						};
					});
					// col headings = x axis labels
					xaxis = {
						tickColor: '#EFEDEE',
						autoscaleMargin: 0.02, // allow space left and right
						ticks: $.map( $( 'thead th', table ).slice( 1 ), function( th, col ) {
							return [[ Math.floor( rows / 2 ) + ( col * ( rows + 1 )), $( th ).text() ]];
						})
					};

				} else {
					// group by row
					// row 1 = [ th, a, b ] -> { label: thead > th, data: [[ x1, a ], [ x2, m ], [ x3, x ]] }
					// row 2 = [ th, m, n ]
					// row 3 = [ th, x, y ]
					// note: assume row headings
					data = $.map( data[ 0 ].slice( 1 ), function( d, col ) {
						return {
							label: $( 'thead th', table ).eq( col + 1 ).text(),
							data: $.map( data, function( rowData, row ) {
								var value = rowData[ col + 1 ];
								if ( value > yaxis.max ) {
									yaxis.max = value;
								}
								return [[ col + ( row * ( cols + 1 )), value ]];
							})
						};
					});
					// row headings = x axis labels
					xaxis = {
						tickColor: '#EFEDEE',
						labelWidth: 10,
						autoscaleMargin: 0.02, // allow space left and right
						ticks: $.map( $( 'tbody th', table ), function( th, row ) {
							return [[ Math.floor( cols / 2 ) + ( row * ( cols + 1 )), $( th ).text() ]];
						})
					};
				}
				series = {
					bars: {
						show: true,
						barWidth: 0.75,
						align: 'center',
						fill: 1.0
					}
				};
				legend = { show: !! config.legend };
				if ( typeof config.legend === 'string' && $( config.legend ).length > 0 ) {
					legend.container = config.legend;
				}
				break;

			case 'pie':
				// assume first cell is headings
				// [ a, b, c ] => { label: a, data: [ b, c ] }
				data = $.map( data, function( d ) {
					return {
						label: d.shift(),
						data: d
					};
				});
				series = {
					pie: {
						show: true,
						radius: 0.75,
						label: {
							show: true,
							radius: 0.85,
							formatter: function( label, series ) {
								return Math.round( series.percent ) + '%';
							},
							background: { color: 'transparent' }
						}
					}
				};

				grid = {
					hoverable: true,
					clickable: true
				};

				if ( !! config.legend ) {
					legend = {
						show: true,
						// include % value in legend labels
						labelFormatter: function( label, series ) {
							if ( series.percent === 0 ) {
								return null;
							}
							return label + ' (' + Math.round( series.percent ) + '%)';
						},
						backgroundColor: 'transparent'
					};
				} else {
					legend = { show: false };
				}
				break;
			}

			// add margin to yaxis
			yaxis.max += yaxis.max / 10;

			// console.log( 'chart data', data, xaxis, yaxis );
			// create chart
			$.plot( chart, data, {
				series: series,
				grid: grid,
				colors: config.colours,
				xaxis: xaxis,
				yaxis: yaxis,
				legend: legend
			});

			// check pie labels for overlap
			if ( config.type === 'pie' ) {
				(function() {
					var labels = $( '.pieLabel', chart ), label, prevLabel;
					if ( labels.length > 1 ) {
						for ( var i = 0; i < labels.length; i++ ) {
							label = labels.eq( i );
							prevLabel = labels.eq( i - 1 );
							if ( ! (
								// bounding box collision detection
								// http://devmag.org.za/2009/04/13/basic-collision-detection-in-2d-part-1/
								label.offset().top + label.height() < prevLabel.offset().top ||
								label.offset().top > prevLabel.offset().top + prevLabel.height() ||
								label.offset().left > prevLabel.offset().left + prevLabel.width() ||
								label.offset().left + label.width() < prevLabel.offset().left
							)) {
								// move this label above the previous one
								label.css( 'top', prevLabel.position().top - ( label.height() + 1 ));
							}
						}
					} else {
						// 1 label = 100%
						labels.addClass( 'pieLabel100' );
					}
				}());
			}

			// trigger SWE layout reflow
			container.trigger( 'x-height-change' );
		};


		// charts
		callback.pie = callback.chart;
		callback.line = callback.chart;
		callback.bar = callback.chart;


		// default callback type
		if ( typeof callback[ config.type ] !== 'function' ) {
			config.type = 'ul';
		}

		// get data from CKAN
		qg.data.get( 'data.qld.gov.au', config.sql, callback[ config.type ] );
	});


}( jQuery, qg ));
