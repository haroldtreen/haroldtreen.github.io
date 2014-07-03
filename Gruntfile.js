module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: 9000, //run on port 9000
          open: true //open browser         
        }
      }
    },
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
          port: 8001,
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
    		files: ['sass/*.scss'],
    		tasks: ['sass'],
        options: {
          livereload: true
        }
    	}
    }    
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-reload');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ['connect', 'watch']);
};