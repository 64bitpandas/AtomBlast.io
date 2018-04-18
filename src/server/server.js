var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

var config  = require('./config.json');

app.use(express.static(__dirname + '/../client'));

io.on('connection', function (socket) {
  console.log("A player has connected!");
  // Write your code here
  console.log('Socket ' + socket.id + ' joining room ' + socket.handshake.query.room);
  socket.join(socket.handshake.query.room, function() {
    console.log('Socket ' + socket.id + ' joined successfully!');
  })
  socket.broadcast.emit('testEmit', 'attempt');

  socket.on('playerChat', function (data) {
    // console.log('sender: ' + data.sender);
    var _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    var _message = data.message.replace(/(<([^>]+)>)/ig, '');

    console.log('[CHAT] [' + (new Date()).getHours() + ':' + (new Date()).getMinutes() + '] ' + _sender + ': ' + _message);
    
    socket.broadcast.emit('serverSendPlayerChat', { sender: _sender, message: _message.substring(0, 35) });
  });
});

var serverPort = process.env.PORT || config.port;
http.listen(serverPort, function() {
  console.log("Starting http server on port: " + serverPort);
});

console.log('Server has started');