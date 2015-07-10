module.exports = function(grunt) {

	require('jit-grunt')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		less: {
			demo: {
				options: {
					compress: true,
					yuicompress: true,
					optimization: 2
				},
				files: {
					"style.css": "style.less"
				}
			}
		},
		uglify: {

			// non-minified version
			development: {
				src: [
					'src/ModelEditor.js',
					'src/Base.js',
					'src/Input.js',
					'src/RTE.js',
					'src/Checkbox.js',
					'src/Select.js'
				],
				dest: 'model-editor.js',
				options: {
					beautify: true,
					sourceMap: true
				}
			},
			production: {
				src: [
					'src/ModelEditor.js',
					'src/Base.js',
					'src/Input.js',
					'src/RTE.js',
					'src/Checkbox.js',
					'src/Select.js'
				],
				dest: 'model-editor.min.js',
				options: {
					banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy, HH:MM:ss") %> */\n',
					sourceMap: true
				}
			}
		},
		
		watch: {
			js: {
				files: ['src/**/*.js'],
				tasks: ['uglify'],
				options: {
					nospawn: true
				}
			}
		}
	});

	grunt.registerTask('default', ['less', 'uglify']);
	grunt.registerTask('dev', ['watch']);
};