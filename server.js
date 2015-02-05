var R            = require('ramda');
var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var FeedParser   = require('feedparser');
var request      = require('request');
var assert       = require('assert');
var MongoClient  = require('mongodb').MongoClient;

util.inherits(MongoClient, EventEmitter);

var feedparser = new FeedParser([]);
var mongoUrl = 'mongodb://localhost:27017/concierge';
var teatro_breton = 'http://www.teatrobreton.org/rss_eventos.asp';

feedparser.on('error', function(error) {
  console.log('Feedparser BANG!');
  process.exit(0);
});

feedparser.on('meta', function() {
  var stream = this
    , meta = this.meta;

  var metaData = {
    type: meta['#type']
    , version: meta['#version']
    , title: meta['title']
    , description: meta['description']
    , link: meta['link']
  };
  console.log(JSON.stringify(metaData));
  MongoClient.prototype.emit('newMeta', metaData);
});

/*
feedparser.on('readable', function() {
  var stream = this
    , meta = this.meta
    , item;

  var metaData = {
    type: meta['#type']
    , version: meta['#version']
    , title: meta['title']
    , description: meta['description']
    , link: meta['link']
  };
  var data = {

  };
  console.log(JSON.stringify(metaData));
});

var feed = request(teatro_breton);
feed.on('error', function(error) {
  console.log('Bang!');
  process.exit(0);
});

feed.on('response', function(res) {
  var stream = this;
  if(res.statusCode != 200) {
    return this.emit('error', new Error('Evil status code -> ' + res.statusCode));
  }
  stream.pipe(feedparser);
});
*/

MongoClient.prototype.on('connect', function(db) {
  console.log('connected');
  MongoClient.prototype.db = db;
  var feed = request(teatro_breton);
  feed.on('error', function(error) {
    console.log('Bang!');
    process.exit(0);
  });
  feed.on('response', function(res) {
    var stream = this;
    if(res.statusCode != 200) {
      return this.emit('error', new Error('Evil status code -> ' + res.statusCode));
    }
    stream.pipe(feedparser);
  });
});

MongoClient.prototype.on('newMeta', function(metaData) {
  if(MongoClient.prototype.db) {
    console.log('Creating a new meta');
    var siteDoc = MongoClient.prototype.db.collection('site');
    siteDoc.insert(metaData, function(err, res) {
      assert.equal(err, null);
      assert.equal(1, res.result.n);
      MongoClient.prototype.emit('close');
    });
  } else {
    return this.emit('error', new Error('The fucking database is not set, vole.'));
  }
});

/*
MongoClient.prototype.on('newFeed', function(data) {
  if(MongoClient.prototype.db) {
    console.log('Creating a new feed');
    var feedColl = MongoClient.prototype.db.collection('feed');
    feedColl.insert(data, function(err, result) {
      assert.equal(err, null);
      assert.equal(1, result.result.n);
    });
  }
});
*/

MongoClient.prototype.on('close', function() {
  console.log('closing');
  if(MongoClient.prototype.db) {
    MongoClient.prototype.db.close();
  }
});

MongoClient.connect(mongoUrl, function(error, db) {
  assert.equal(null, error);
  MongoClient.prototype.emit('connect', db);
});
