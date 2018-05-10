const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const colors = require('colors'); // Conosle colors :D
const debug = true;

var config = require('./config.json');

app.use(express.static(`${__dirname}/../client`));

/* Array of all connected players. All players must contain:
 * id: Socket id
 * name: Player name
 * room: Room that player is currently in
 * x: Current x-position on map
 * y: Current y-position on map
*/
let players = [];

// Initialize all socket listeners when a request is established
io.on('connection', socket => {

  // Join custom room
  socket.join(socket.handshake.query.room, () => {
    console.log('[Server] '.bold.blue + `Player ${socket.handshake.query.name} (${socket.id}) joined room ${socket.handshake.query.room}`.yellow);
  });

  // Receives a chat from a player, then broadcasts it to other players
  socket.on('playerChat', data => {
    // console.log('sender: ' + data.sender);
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    const _message = data.message.replace(/(<([^>]+)>)/ig, '');

    console.log('[CHAT] '.bold.blue + `${(new Date()).getHours()}:${(new Date()).getMinutes()} ${_sender}: ${_message}`.magenta);

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

  //On Player Movement
  socket.on('move', data => {
    //Debug Logging REMOVE FOR PRODUCTION
    console.log("Socket: " + socket.id + " has moved");
    console.log(data.sender.x + "\n" + data.sender.y);
  }); 

  //Handle socket disconnect
  // socket.on('disconnect', data => {
  //   console.log('Received disconnect'); //don't use double quotes
  //   console.log(data);
  //   // const _sender = socket.handshake.query.name.replace(/(<([^>]+)>)/ig, '');
  //   socket.broadcast.emit('serverSendDisconnectMessage', {
  //     // sender: _sender,
  //     reason: data
  //   });
  // });

  // MISSING COMMENT
  socket.on('mouse',
    function (data) {
      console.log("Received: 'mouse' " + data.x + " " + data.y);
    });

});

// Notify on console when server has started
const serverPort = process.env.PORT || config.port;
http.listen(serverPort, () => {
  console.log('[Server] '.bold.blue + `started on port: ${serverPort}`.yellow);
});