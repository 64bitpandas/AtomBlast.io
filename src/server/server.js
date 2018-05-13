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
 * theta: Current direction of travel to use in client prediction
 * speed: Current speed of player to use in client prediction
*/
let players = {};

// Initialize all socket listeners when a request is established
io.on('connection', socket => {

  // Join custom room
  socket.join(socket.handshake.query.room, () => {
    console.log('[Server] '.bold.blue + `Player ${socket.handshake.query.name} (${socket.id}) joined room ${socket.handshake.query.room}`.yellow);
  });

  // Add player to array
  players[socket.id] = {
    id: socket.id,
    name: socket.handshake.query.name,
    room: socket.handshake.query.room,
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    theta: 0,
    speed: 0
  };

  // Setup player array sync- once a frame
  setInterval(() => {
    socket.emit('playerSync', players);
  }, 1000/60);

  // Receives a chat from a player, then broadcasts it to other players
  socket.on('playerChat', data => {
    // console.log('sender: ' + data.sender);
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    const _message = data.message.replace(/(<([^>]+)>)/ig, '');

    console.log('[CHAT] '.bold.blue + `${(new Date()).getHours()}:${(new Date()).getMinutes()} ${_sender}: ${_message}`.magenta);

    socket.broadcast.emit('serverSendPlayerChat', { sender: _sender, message: _message.substring(0, 35) });
  });

  // Other player joins the room
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

  /**
   * On player movement:
   * data is in format
   *  - id: index of player that moved
   *  - x: new x position
   *  - y: new y position
   *  - theta: angle of player
   *  - speed: how fast the player is going
   */
  socket.on('move', data => {
    if(players[data.id] !== undefined) {
      players[data.id].x = data.x;
      players[data.id].y = data.y;
      players[data.id].theta = data.theta;
      players[data.id].speed = data.speed;
    }
  }); 

  socket.on('disconnect', data => {
    console.log("Disconnect Received: " + data);
    players[socket.id] = null;
  });

});

// Notify on console when server has started
const serverPort = process.env.PORT || config.port;
http.listen(serverPort, () => {
  console.log('[Server] '.bold.blue + `started on port: ${serverPort}`.yellow);
});