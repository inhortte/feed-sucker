// #! /usr/bin/env node

var request    = require('request');
var FeedParser = require('feedparser');
var Readable   = require('stream').Readable;

if(process.argv.length != 3) {
  var programName = require('path').basename(process.argv[1]);
  console.log('Usage: ' + programName + " feed_uri");
  process.exit();
}

var feedUri = process.argv.pop();

function fetchFeed(feedLink) {
  var requestOptions = { uri: feedLink };
  request(requestOptions, function(err, message, res) {
    if(err) {
      console.log('Request bang! -> ' + err);
      process.exit(0);
    }

    var feedparser = new FeedParser([]);
    feedparser.on('error', function(error) {
      console.log('Feedparser BANG! ' + error);
      process.exit(0);
    });
    feedparser.on('readable', function() {
      var stream = this
        , meta = this.meta
        , item;

      console.log(meta);

      item = stream.read();

      console.log(item);

      process.exit();
    });
    feedparser.on('end', function() {
      // console.log('Felices sueňos.');
      // cb(metaData);
    });

    var stream = new Readable;
    stream.push(res);
    stream.push(null);
    stream.pipe(feedparser);
  });
}

fetchFeed(feedUri);
