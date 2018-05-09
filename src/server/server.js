const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const debug = true;

var config = require('./config.json');

app.use(express.static(`${__dirname}/../client`));

// Initialize all socket listeners when a request is established
io.on('connection', socket => {

  // Join custom room
  socket.join(socket.handshake.query.room, () => {
    console.log(`Socket ${socket.id} joined room ${socket.handshake.query.room}`);
  });

  // Receives a chat from a player, then broadcasts it to other players
  socket.on('playerChat', data => {
    // console.log('sender: ' + data.sender);
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    const _message = data.message.replace(/(<([^>]+)>)/ig, '');

    console.log(`[CHAT] [${(new Date()).getHours()}:${(new Date()).getMinutes()}] ${_sender}: ${_message}`);

    socket.broadcast.emit('serverSendPlayerChat', { sender: _sender, message: _message.substring(0, 35) });
  });

  // Player joins the room
  socket.on('playerJoin', data => {
    // console.log('sender: ' + data.sender);
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    socket.broadcast.emit('serverSendLoginMessage', { sender: _sender });
  });

  // Broadcasts player join message
  socket.on('connect', () => {
    console.log(socket.id);
    socket.broadcast.emit('serverSendLoginMessage', {
      sender: socket.id
    });
  });

  // Handle socket disconnect
  // socket.on('disconnect', data => {
  //   console.log('Received disconnect'); //don't use double quotes
  //   const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
  //   socket.broadcast.emit('serverSendDisconnectMessage', {
  //     sender: _sender,
  //     reason: data
  //   });
  // });

  // MISSING COMMENT
  socket.on('mouse',
    function (data) {
      console.log("Received: 'mouse' " + data.x + " " + data.y);
    });
});

if (debug) {
  // socket.on()
}

const serverPort = process.env.PORT || config.port;
http.listen(serverPort, () => {
  console.log(`Starting http server on port: ${serverPort}`);
});

console.log('Server has started');