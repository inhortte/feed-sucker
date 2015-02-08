var socket = io.connect('http://localhost:3257');

socket.on('fib', function(fib) {
  $('#fib').html(fib.fib);
});
$('#clear-meta').click(function() {
  socket.emit('clear meta');
});
$('#clear-feeds').click(function() {
  socket.emit('clear feeds');
});
$('#put-meta').click(function() {
  socket.emit('put meta');
});
$('#put-feeds').click(function() {
  socket.emit('put feeds');
});
