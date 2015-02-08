var async = require('async');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// El puerto debe estar en un archivo de configuración
var port = 3257;
var fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];

app.use(express.static(__dirname + '/../public'));

app.get('/', function(req, res) {
  res.sendFile('index.html');
});

io.on('connection', function(socket) {
  console.log('someone connected!');
  async.eachSeries(fibs, function(fib, cb) {
    console.log('fib: ' + fib);
    socket.emit('fib', {fib: fib});
    setTimeout(function() {
      cb();
    }, 1000);
  }, function(err) {
    // nada
  });
});

server.listen(port, function() {
  console.log('The server listens.');
});
