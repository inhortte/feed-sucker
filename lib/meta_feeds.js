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

// For now, the fields for each entry in a feed will be hardcoded,
// however saved for each site for the option to vary later.
// oh - and put this in a config file.
var feedFields = {
  title:       "title",
  description: "description",
  summary:     "summary",
  date:        "date",
  pubdate:     "pubdate",
  pubDate:     "pubDate",
  link:        "link",
  guid:        "guid",
  author:      "author",
  comments:    "comments",
  origlink:    "origlink",
  image:       "image",
  source:      "source",
  categories:  "categories",
  enclosures:  "enclosures"
};

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
        , language: meta['language']
        , feedLink: feedLink
        , feedFields: feedFields
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

// ---------------------------------------------
// Introducing the site collection
// La metadata de cada sitio está poniendo aquí.
// ---------------------------------------------
var newMeta = function(metaData) {
  if(MongoClient.prototype.db) {
    var siteDoc = MongoClient.prototype.db.collection('site');

    siteDoc.insert(metaData, function(err, res) {
      console.log(metaData._id);
      if(err) {
        console.log('The connection is probably closed.');
      }
      // assert.equal(err, null);
      // assert.equal(1, res.result.n);
    });
  } else {
    return this.emit('error', new Error('The fucking database is not set, vole.'));
  }
}

// -----------------------------------------------------
// Introducing the connection
// Cuando hagamos la conexión, entonces hagamos un ciclo
// a traves las metadatas, llamando a newMeta cada vez.
// -----------------------------------------------------
var mongoConnected = function(feedMetas) {
  console.log('mongo connected');

  async.each(feedMetas, function(metaData, cb) {
    MongoClient.prototype.emit('newMeta', metaData); // no funciona.
    cb();
  }, function(err) {
    if(err) {
      return this.emit('error', new Error('Async final callback failed - or something'));
    }
    // note - An error occurs because of the close, though all of the entries
    // are already written to mongo. This is a current mystery.
    MongoClient.prototype.emit('close');
  });
};

var mongoClose = function() {
  console.log('closing mongo');
  if(MongoClient.prototype.db) {
    MongoClient.prototype.db.close();
  }
};

// -------------------------------------------------
// El ciclo principal - bueno, un fold, actualmente,
// porque rehuso a utilizar 'ciclos' en mis codigos.
// Al principal, los feeds está leyendo y procesado.
// Entonces, damos los resultos a mongodb.
// -------------------------------------------------
async.foldl(linkList, [], function(memo, feedLink, cb) {
  fetchFeed(feedLink, function(metaData) {
    memo.push(metaData);
    cb(null, memo);
  });
}, function(err, feedMetas) {
  var uniq = R.uniqWith(function(a, b) {
    return a['feedLink'] === b['feedLink'];
  }, feedMetas);
  console.log(JSON.stringify(uniq));

  MongoClient.connect(mongoUrl, function(err, db) {
    assert.equal(null, err);
    MongoClient.prototype.db = db;
    MongoClient.prototype.on('connect', mongoConnected);
    MongoClient.prototype.on('newMeta', newMeta);
    MongoClient.prototype.on('close', mongoClose);

    MongoClient.prototype.emit('connect', uniq);
  });
});
