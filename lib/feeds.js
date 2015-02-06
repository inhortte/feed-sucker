var R = require('ramda');
var request = require('request');
var async = require('async');
var FeedParser = require('feedparser');
var assert = require('assert');
var MongoClient  = require('mongodb').MongoClient;
var Readable = require('stream').Readable;

var mongoUrl = 'mongodb://localhost:27017/concierge';

function feedToEvents(feedMeta) {
  var feedFields = feedMeta['feedFields'];
  var feedKeys = Object.keys(feedFields);
  var feedColl = MongoClient.prototype.db.collection('feed');

  request({uri: feedMeta['feedLink']}, function(err, message, res) {
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

      async.whilst(function() {
        return(item = stream.read());
      }, function(cb) {
        console.log(item['title']);
        var event = R.foldl(function(memo, field) {
          memo[feedFields[field]] = item[field];
          return memo;
        }, {}, feedKeys);
        event['title'] = item['title'];
        event['feedMeta'] = feedMeta['_id'];
        event['feedLink'] = feedMeta['feedLink'];
        feedColl.insert(event, function(err, res) {
          if(err) {
            console.log('The connection is probably closed. -> ' + err);
          }
          cb();
        });
      }, function(err) {
        if(err) {
          console.log(err);
        }
      });
    });
    feedparser.on('end', function() {
      console.log('Felices sueňos.');
      // cb(metaData);
    });
    var stream = new Readable;
    stream.push(res);
    stream.push(null);
    stream.pipe(feedparser);
  });
}

function getFeedMetaData(cb) {
  var siteColl = MongoClient.prototype.db.collection('site');

  siteColl.findOne({}, {fields: {_id: 1, feedLink: 1, feedFields: 1}}, function(err, metaData) {
    assert.equal(null, err);
    console.log(JSON.stringify(metaData));
    console.log('----------------------------------------');
    cb(metaData);
  });
}

MongoClient.connect(mongoUrl, function(err, db) {
  assert.equal(null, err);
  MongoClient.prototype.db = db;

  getFeedMetaData(function(metaData) {
    feedToEvents(metaData);
  });
});
