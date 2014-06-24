module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      // define the files to lint
      files: ['gruntfile.js', 'src/**/*.js', 'spec/**/*.js'],
      // configure JSHint (documented at http://www.jshint.com/docs/)
      options: {
          // more options here if you want to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    },
    reload: {
        port: 3001,
        proxy: {
            host: 'localhost',
            port: 8080 // should match server.port config
        }
    },
    sass: {                              // Task
      dist: {                            // Target
        files: [{                         // Dictionary of files
        	expand: true,
        	cwd: 'sass',
        	src: ['*.scss'],
        	dest: './styles',
        	ext: '.css'
        }]
      }
    },
    watch: {
    	css: {
    		files: '**/*.scss',
    		tasks: ['sass'],
    		options: {
    			livereload: true
    		}
    	},
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }    
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-reload');
  grunt.loadNpmTasks('grunt-contrib-watch');


  grunt.registerTask('default', ['watch']);
};