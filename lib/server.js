var async   = require('async');
var express = require('express');
var app     = express();
var server  = require('http').Server(app);
var io      = require('socket.io')(server);

var meta    = require('./meta_feeds.js');
var feeds   = require('./feeds.js');

// El puerto debe estar en un archivo de configuración
var port = 3257;
var fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];

app.use(express.static(__dirname + '/../public'));

app.get('/', function(req, res) {
  res.sendFile('index.html');
});

function fibseq(socket) {
  async.eachSeries(fibs, function(fib, cb) {
    socket.emit('fib', {fib: fib});
    setTimeout(function() {
      cb();
    }, 1000);
  }, function(err) {
    fibseq(socket);
  });
}

io.on('connection', function(socket) {
  console.log('someone connected!');
  fibseq(socket);
  socket.on('clear meta', function() {
    console.log('clear meta');
    meta.clearMeta();
  });
  socket.on('clear feeds', function() {
    console.log('clear feeds');
    feeds.clearFeeds();
  });
  socket.on('put meta', function() {
    console.log('put meta');
    meta.putMeta();
  });
  socket.on('put feeds', function() {
    console.log('put feeds');
    feeds.putFeeds();
  });
});

server.listen(port, function() {
  console.log('The server listens.');
});
