module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: 9000, //run on port 9000    
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
    markdown: {
      all: {
        files: [
          {
            expand: true,
            src: 'src/md/*.md',
            dest: 'src/html',
            flatten: true,
            ext: '.html'
          }
        ]
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
    	},
      src: {
        files: ['src/md/*.md'],
        tasks: ['markdown']
      }
    }    
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-reload');
  grunt.loadNpmTasks('grunt-markdown');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['connect', 'watch']);
};