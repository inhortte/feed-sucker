var socket = io.connect('http://localhost:3257');

socket.on('fib', function(fib) {
  $('#fib').html(fib.fib);
});
