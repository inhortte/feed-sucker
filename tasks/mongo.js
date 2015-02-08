var meta = require('../lib/meta_feeds.js');
var feeds = require('../lib/feeds.js');

module.exports = function(grunt) {

  grunt.registerTask('putMeta', 'Add all feeds (sites) to the site collection', function() {
    meta.putMeta();
  });

  grunt.registerTask('clearMeta', 'Clear the site collection', function() {
    meta.clearMeta();
  });

  grunt.registerTask('putFeeds', 'Add all events to the feed collection', function() {
    feeds.putFeeds();
  });

  grunt.registerTask('clearFeeds', 'Clear the feed collection', function() {
    feeds.clearFeeds();
  });
};
