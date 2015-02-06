var assert = require('assert');
var MongoClient  = require('mongodb').MongoClient;

var mongoUrl = 'mongodb://localhost:27017/concierge';

function getFeedMetaData() {
  var siteColl = MongoClient.prototype.db.collection('site');

  siteColl.findOne({}, {fields: {_id: 1, feedLink: 1, feedFields: 1}}, function(err, doc) {
    assert.equal(null, err);
    console.log(JSON.stringify(doc));
  });
}

MongoClient.connect(mongoUrl, function(err, db) {
  assert.equal(null, err);
  MongoClient.prototype.db = db;

  getFeedMetaData();
});
