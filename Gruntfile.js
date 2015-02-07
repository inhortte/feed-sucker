module.exports = function(grunt) {
  grunt.initConfig({
    execute: {
      meta_feeds: {
        src: 'lib/meta_feeds.js'
      },
      feeds: {
        src: 'lib/feeds.js'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-execute');

  grunt.loadTasks('tasks');
  grunt.registerTask('sites', ['execute:meta_feeds']);
  grunt.registerTask('meta', ['execute:meta_feeds']);
  grunt.registerTask('feeds', ['execute:feeds']);
  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('default', ['test']);
};
