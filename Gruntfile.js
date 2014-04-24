'use strict';

module.exports = function( grunt ) {

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON( 'package.json' ),
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> The State of Queensland;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',


		// Task configuration.
		clean: {
			files: [ 'dist' ]
		},



		// production pipeline tasks
		concat: {
			options: {
				banner: '<%= banner %>',
				stripBanners: true
			},
			dist: {
				src: [
					'bower_components/jquery-jsonp/src/jquery.jsonp.js',
					'src/lib/data.qld.gov.au.js',
					'src/lib/jquery.got-style.js',
					'src/lib/jquery.compact.js',
					'src/lib/jquery.compact.tabbed.js',
					'src/lib/jquery.compact.init.js',
					'bower_components/markdown-js/lib/markdown.js',
					'src/lib/template.js',
					'bower_components/flot/jquery.flot.js',
					'bower_components/jquery.flot.orderBars/index.js',
					'bower_components/flot/jquery.flot.categories.js',
					'bower_components/flot/jquery.flot.pie.js',
					'src/<%= pkg.name %>.js'
				],
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				files: {
					'dist/<%= pkg.name %>.min.js': [ 'dist/<%= pkg.name %>.js' ]
				}
			},
		},


		// code quality tasks
		jshint: {
			gruntfile: {
				options: { jshintrc: '.jshintrc' },
				src: [
					'Gruntfile.js',
					'.jshintrc',
					'*.json'
				]
			},
			src: {
				options: { jshintrc: 'src/.jshintrc' },
				src: [ 'src/**/*.js' ]
			},
		},


		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: [ 'jshint:gruntfile' ]
			},
			src: {
				files: '<%= jshint.src.src %>',
				tasks: [ 'jshint:src' ]
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	// Default task.
	grunt.registerTask( 'test', [ 'jshint' ]);
	grunt.registerTask( 'produce', [ 'clean', 'concat', 'uglify' ]);
	grunt.registerTask( 'default', [ 'test', 'produce' ]);

};