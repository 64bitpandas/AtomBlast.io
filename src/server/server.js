const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
import colors from 'colors'; // Console colors :D
import {GLOBAL} from '../client/js/global.js';
import { createPowerup } from '../client/js/powerup.js';

var config = require('./config.json');


const debug = true;
app.use(express.static(`${__dirname}/../client`));

/* Array of all connected players and powerups in respective rooms. All players must contain:
 * id: Socket id
 * name: Player name
 * room: Room that player is currently in
 * x: Current x-position on map
 * y: Current y-position on map
 * theta: Current direction of travel to use in client prediction
 * speed: Current speed of player to use in client prediction
 * powerups: Object containing all powerups that the player has
 * 
 * Structure of Rooms object:
 * rooms: {
 *    players: {
 *      sampleID: {
 *        Insert Player object here
 *      }
 *    }
 *    powerups: [
 *       0: {
 *          Insert Powerup object here
 *       }
 *    ]
 * }
*/
let rooms = {};

// Initialize all socket listeners when a request is established
io.on('connection', socket => {

  // Join custom room
  socket.join(socket.handshake.query.room, () => {
    console.log('[Server] '.bold.blue + `Player ${socket.handshake.query.name} (${socket.id}) joined room ${socket.handshake.query.room}`.yellow);
  });

  // Player room name
  let room = socket.handshake.query.room;

  // Initialize room array and spawn powerups on first player join
  if(rooms[room] === undefined || rooms[room] === null) {
    console.log('[Server] '.bold.blue + 'Setting up room '.yellow + ('' + room).bold.red);
    rooms[room] = {};
    rooms[room].players = {};
    rooms[room].powerups = [];
    // Generate Powerups
    for(let num = 0; num < Math.floor(Math.random() * (GLOBAL.MAX_POWERUPS - GLOBAL.MIN_POWERUPS) + GLOBAL.MIN_POWERUPS); num++) {
      let type = Math.floor(Math.random() * GLOBAL.POWERUP_TYPES);
      let powerup = createPowerup(type);
      rooms[room].powerups.push(powerup);
    }
  }

  // Create new player in rooms object
  rooms[room].players[socket.id] = {id: socket.id, name: socket.handshake.query.name, room: socket.handshake.query.room};

  // Setup player array sync- once a frame
  setInterval(() => {
    if(rooms[room] !== undefined)
      socket.emit('playerSync', rooms[room].players);
  }, 1000/60);
  
  setTimeout(() => {
    // Send powerups to player
    if(rooms[room] !== undefined)
      socket.emit('serverSendPowerupArray', { powerups: rooms[room].powerups });
  }, 1500);
    

  // Receives a chat from a player, then broadcasts it to other players
  socket.to(room).on('playerChat', data => {
    // console.log('sender: ' + data.sender);
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    const _message = data.message.replace(/(<([^>]+)>)/ig, '');

    console.log('[CHAT] '.bold.blue + `${(new Date()).getHours()}:${(new Date()).getMinutes()} ${_sender}: ${_message}`.magenta);

    socket.to(room).broadcast.emit('serverSendPlayerChat', { sender: _sender, message: _message.substring(0, 35) });
  });

  // Other player joins the socket.to(room)
  socket.to(room).on('playerJoin', data => {
    // console.log('sender: ' + data.sender);
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    socket.to(room).broadcast.emit('serverSendLoginMessage', { sender: _sender });
  });

  // Broadcasts player join message
  socket.to(room).on('connect', () => {
    socket.to(room).broadcast.emit('serverSendLoginMessage', {
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
  socket.to(room).on('move', data => {
    // Player exists in database already because it was created serverside - no need for extra checking
    if(rooms[room].players[data.id] !== undefined) {
      rooms[room].players[data.id].setData(data.x, data.y, data.theta, data.speed);
    }
  }); 

  // A powerup was equipped or changed
  socket.to(room).on('powerupChange', data => {
    rooms[room].powerups.splice(data.index, 1);
    socket.to(room).broadcast.emit('serverSendPowerupChange', {index: data.index});
  })

  socket.on('disconnect', data => {
    console.log("Disconnect Received: " + data);
    delete rooms[room].players[socket.id];

    // Delete room if there is nobody inside
    if(Object.keys(rooms[room].players).length === 0)  {
      console.log('[Server] '.bold.blue + ' Closing room '.red + (room + '').bold.red);
      delete io.sockets.adapter.rooms[socket.id];
      delete rooms[room];
    }
  });

});

// Notify on console when server has started
const serverPort = process.env.PORT || config.port;
http.listen(serverPort, () => {
  rooms = {};
  console.log('[Server] '.bold.blue + `started on port: ${serverPort}`.blue);
});