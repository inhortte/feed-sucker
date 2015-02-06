var R            = require('ramda');
var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var async        = require('async');
var FeedParser   = require('feedparser');
var request      = require('request');
var assert       = require('assert');
var MongoClient  = require('mongodb').MongoClient;
var Readable     = require('stream').Readable;

util.inherits(MongoClient, EventEmitter);

var mongoUrl = 'mongodb://localhost:27017/concierge';
var linkList = [ 'http://www.teatrobreton.org/rss_eventos.asp',
                 'http://www.teatrobreton.org/rss_noticias.asp',
                 'http://www.teatrobreton.org/rss_eventos.asp' ];

var requestOptions = {};

// ------------------------------------------
// Introducing the request - one per feedLink
// ------------------------------------------
function fetchFeed(feedLink, cb) {
  requestOptions['uri'] = feedLink;
  request(requestOptions, function(err, message, res) {
    if(err) {
      console.log('Request bang! -> ' + err);
      process.exit(0);
    }

    // ---------------------------------------
    // Introducing the feedparser
    // Hay tres eventos - error, meta and end
    // El segundo acumula la metadata del feed
    // Otros explican ellos mismos
    // ---------------------------------------
    var metaData;
    var feedparser = new FeedParser([]);
    feedparser.on('error', function(error) {
      console.log('Feedparser BANG! ' + error);
      process.exit(0);
    });
    feedparser.on('meta', function() {
      var stream = this
      , meta = this.meta;

      metaData = {
        type: meta['#type']
        , version: meta['#version']
        , title: meta['title']
        , description: meta['description']
        , link: meta['link']
        , feedLink: feedLink
      };
      // console.log(JSON.stringify(metaData));
    });
    feedparser.on('end', function() {
      console.log('Felices sueňos.');
      cb(metaData);
    });

    // --------------------------------------------------
    // Introducing the stream
    // Creamos un stream de un string
    // Hay otras maneras hacerlo con el módulo 'request',
    // pero pienso que eso es el más claro.
    // --------------------------------------------------
    var stream = new Readable;
    stream.push(res);
    stream.push(null);
    stream.pipe(feedparser).resume();
  });
}

async.foldl(linkList, [], function(memo, feedLink, cb) {
  fetchFeed(feedLink, function(metaData) {
    memo.push(metaData);
    cb(null, memo);
  });
}, function(err, feedLinks) {
  var uniq = R.uniqWith(function(a, b) {
    return a['feedLink'] === b['feedLink'];
  }, feedLinks);
  console.log(JSON.stringify(uniq));
});

/*
var feed = request(feedLink);
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


/*
var newMeta = function(db, metaData) {
  if(db) {
    var siteDoc = db.collection('site');

    // If the metadata already exists, do not insert it another time!
    siteDoc.count({feedLink: metaData['feedLink']}, function(err, count) {
      assert.equal(err, null);
      console.log('count is ' + count);
      if(count == 0) {
        console.log('about to insert.');
        siteDoc.insert(metaData, function(err, res) {
          console.log(metaData._id);
          assert.equal(err, null);
          assert.equal(1, res.result.n);
        });
      }
    });
  } else {
    return this.emit('error', new Error('The fucking database is not set, vole.'));
  }
}

MongoClient.prototype.on('newMeta', newMeta);

// MongoClient.prototype.on('connect', function(db, linkList) {
var connect = function(db, linkList) {
  console.log('connected');
  MongoClient.prototype.db = db;

  // This needs to be fully asynchronous eventually. I'm not sure now, but this may have to be a server accepting links.
  async.eachSeries(linkList, function(feedLink, cb) {
    var feedparser = new FeedParser([]);
    feedparser.on('error', function(error) {
      console.log('Feedparser BANG! ' + error);
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
        , feedLink: feedLink
      };
      console.log(JSON.stringify(metaData));
      // MongoClient.prototype.emit('newMeta', metaData); // no funciona.
      newMeta(db, metaData);
    });

     var feed = request(feedLink);
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
     cb();
  }, function(err) {
    if(err) {
      return this.emit('error', new Error('Async final callback failed - or something'));
    }
    // MongoClient.prototype.emit('close');
  });
};

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

MongoClient.prototype.on('close', function() {
  console.log('closing');
  if(MongoClient.prototype.db) {
    MongoClient.prototype.db.close();
  }
});

async.waterfall([
  function(cb) {
    MongoClient.connect(mongoUrl, function(error, db) {
      assert.equal(null, error);
//      MongoClient.prototype.emit('connect', db, linkList);
      cb(null, db);
    });
  }, function(db, cb) {
    connect(db, linkList);
    cb(null, db);
  }
], function(err, db) {
//  db.close();
});
*/
