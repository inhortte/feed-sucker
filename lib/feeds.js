var R           = require('ramda');
var request     = require('request');
var async       = require('async');
var FeedParser  = require('feedparser');
var assert      = require('assert');
var MongoClient = require('mongodb').MongoClient;
var Readable    = require('stream').Readable;

var mongoUrl = 'mongodb://localhost:27017/concierge';
var requestOptions = {};

function fetchFeed(feedMeta) {
  var feedFields = feedMeta['feedFields'];
  var feedKeys = Object.keys(feedFields);
  var feedLink = feedMeta['feedLink'];
  var feedColl = MongoClient.prototype.db.collection('feed');

  requestOptions['uri'] = feedLink;
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

      // ----------------------------------------------------------
      // El feedparser, siendo un bastardo, genera un stream
      // lo que tiene que estar leido por cada trozo de 'data',
      // lo que en esto caso es un item, o en nuestra terminología
      // es un entry. Aquí, hacemos ciclos a traves todos de ellos.
      // ----------------------------------------------------------
      async.whilst(function() {
        return(item = stream.read());
      }, function(cb) {
        console.log(item['title']);

        // ----------------------------------------------------
        // Si no sepas que signifique 'fold', supongo que
        // debas averiguarlo. Utilizando el objecto de mapa
        // 'feedFields', cambiando los llaves del feed original
        // a los llaves preferidos. Entonces, aňadimos un poco
        // de denormalizatión con dos trozos de la metadata.
        // ----------------------------------------------------
        var event = R.foldl(function(memo, field) {
          memo[feedFields[field]] = item[field];
          return memo;
        }, {}, feedKeys);
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

  var siteColl = MongoClient.prototype.db.collection('site');

  siteColl.find({}, {_id: 1, feedLink: 1, feedFields: 1}).toArray(function(err, feeds) {
    if(err) {
      console.log('find error ' + err);
      process.exit();
    }
    async.eachSeries(feeds, function(metaData, cb) {
      console.log(metaData.feedLink);
      fetchFeed(metaData);
      cb();
    }, function(err) {
      if(err) {
        console.log('Line 102 -> ' + err);
      }
    });
  });

//  getFeedMetaData(function(metaData) {
//    fetchFeed(metaData);
//  });
});
