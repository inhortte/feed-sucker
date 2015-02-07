var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var mongoUrl = 'mongodb://localhost:27017/concierge';

module.exports = function(grunt) {

  // ----
  // nofunciona.
  // ----
  grunt.registerTask('clearfeed', 'Remove the feed collection.', function() {
    MongoClient.connect(mongoUrl, function(err, db) {
      var feedColl = db.collection('feed');
      async.waterfall([
        function(cb) {
          console.log('are we getting here?');
          feedColl.drop(function(err) {
            if(err) {
              console.log("FAILED -> " + err);
            }
            cb();
          });
        }
      ], function(err) {
        if(err) {
          console.log('whatever....');
        }
      });
    });
  });
};
