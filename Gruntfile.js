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
				src: [ 'src/<%= pkg.name %>.js' ],
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