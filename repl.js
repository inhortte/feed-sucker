var repl         = require('repl');
var R            = require('ramda');
var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var FeedParser   = require('feedparser');
var request      = require('request');
var assert       = require('assert');
var MongoClient = require('mongodb').MongoClient;
var Readable    = require('stream').Readable;

var replServer = repl.start({
  prompt: "feed_sucker > "
});

util.inherits(MongoClient, EventEmitter);

replServer.context.repl = repl;
replServer.context.R = R;
replServer.context.feedparser = new FeedParser([]);
replServer.context.request = request;
replServer.context.util = util;
replServer.context.EventEmitter = EventEmitter;
replServer.context.MongoClient = MongoClient;
