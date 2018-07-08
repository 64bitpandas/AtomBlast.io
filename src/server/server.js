const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
import colors from 'colors'; // Console colors :D
import {GLOBAL, distanceBetween} from '../client/js/global.js';
var config = require('./config.json');


const DEBUG = true;
app.use(express.static(`${__dirname}/../client`));

/* Array of all connected players and atoms in respective rooms. All players must contain:
 * id: Socket id
 * name: Player name
 * room: Room that player is currently in
 * x: Current x-position on map
 * y: Current y-position on map
 * theta: Current direction of travel to use in client prediction
 * speed: Current speed of player to use in client prediction
 * atoms: Object containing all atoms that the player has
 * 
 * Structure of Rooms object:
 * rooms: {
 *    players: {
 *      sampleID: {
 *        Insert Player object here
 *      }
 *    }
 *    atoms: [
 *       0: {
 *          Insert Atom object here
 *       }
 *    ]
 * }
*/
let rooms = {};

// Initialize all socket listeners when a request is established
io.on('connection', socket => {

  // Join custom room
  socket.join(socket.handshake.query.room, () => {
    console.log('[Server] '.bold.blue + `Player ${socket.handshake.query.name} (${socket.id}) joined room ${socket.handshake.query.room} in team ${socket.handshake.query.team}`.yellow);
  });

  // Player room name
  let room = socket.handshake.query.room;

  // Initialize room array and spawn atoms on first player join
  if(rooms[room] === undefined || rooms[room] === null) {
    console.log('[Server] '.bold.blue + 'Setting up room '.yellow + ('' + room).bold.red);
    rooms[room] = {};
    rooms[room].players = {};
    rooms[room].atoms = {};
    // Generate Atoms. Atoms have a random ID between 10000000 and 99999999, inclusive.
    for(let num = 0; num < Math.floor(Math.random() * (GLOBAL.MAX_POWERUPS - GLOBAL.MIN_POWERUPS) + GLOBAL.MIN_POWERUPS); num++) {
      let type = GLOBAL.ATOM_IDS[Math.floor(Math.random() * GLOBAL.ATOM_IDS.length)];
      let randX = Math.random() * GLOBAL.MAP_SIZE * 2 - GLOBAL.MAP_SIZE;
      let randY = Math.random() * GLOBAL.MAP_SIZE * 2 - GLOBAL.MAP_SIZE;
      let atom = {
        typeID: type,
        id: generateID(),
        posX: randX,
        posY: randY,
        vx: 0,
        vy: 0
      };
      rooms[room].atoms[atom.id] = atom;
    }
  }

  // Create new player in rooms object
  rooms[room].players[socket.id] = {
    id: socket.id, 
    name: socket.handshake.query.name, 
    room: socket.handshake.query.room,
    team: socket.handshake.query.team,
    health: GLOBAL.MAX_HEALTH,
    posX: 0,
    posY: 0,
    // posX: Math.round(Math.random() * GLOBAL.MAP_SIZE * 2 - GLOBAL.MAP_SIZE),
    // posY: Math.round(Math.random() * GLOBAL.MAP_SIZE * 2 - GLOBAL.MAP_SIZE),
    vx: 0,
    vy: 0
  };

 let thisPlayer = rooms[room].players[socket.id];
 
  // Setup player array sync- once a frame
  setInterval(() => {
    if(rooms[room] !== undefined) {
      // Distance checking for all objects
      let tempObjects = {
        players: {},
        atoms: {},
        compounds: {}
      };

      for(let objType in tempObjects) {
        for (let obj in rooms[room][objType])
          if(distanceBetween(rooms[room][objType][obj], thisPlayer) < GLOBAL.DRAW_RADIUS)
            tempObjects[objType][obj] = rooms[room][objType][obj];
      }

      socket.emit('objectSync', tempObjects);
    }
  }, 1000/60);
  
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
    socket.to(room).broadcast.emit('serverSendLoginMessage', { sender: _sender, team: data.team });
    if(DEBUG) {
      socket.to(room).broadcast.emit('serverMSG', 'You are connected to a DEBUG enabled server. ');
    }
  });

  // Broadcasts player join message
  socket.to(room).on('connect', () => {
    socket.to(room).broadcast.emit('serverSendLoginMessage', {
      sender: socket.id
    });
    if(DEBUG) {
      socket.to(room).broadcast.emit('serverMSG', 'You are connected to a DEBUG enabled server. ');
    }
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
      rooms[room].players[data.id].posX = data.posX;
      rooms[room].players[data.id].posY = data.posY;
      rooms[room].players[data.id].vx = data.vx;
      rooms[room].players[data.id].vy = data.vy;
    }

  }); 

  socket.to(room).on('damage', data => {
    if(rooms[room].players[data.id] !== undefined){
      rooms[room].players[data.id].health = data;
    }
  });

  /**
   * On atom movement
   */
  socket.to(room).on('atomMove', data => {
    if(rooms[room].atoms[data.id] !== undefined) {
      rooms[room].atoms[data.id].posX = data.posX;
      rooms[room].atoms[data.id].posY = data.posY;
      rooms[room].atoms[data.id].vx = data.vx;
      rooms[room].atoms[data.id].vy = data.vy;
    }
  })

  // An atom was collected or changed
  socket.to(room).on('atomCollision', data => {
      delete rooms[room].atoms[data.id];
      socket.to(room).broadcast.emit('serverSendAtomRemoval', data);
  });

  // A player spawned a Compound
  socket.to(room).on('createCompound', data => {
    let newCompound = {
      id: generateID(),
      posX: thisPlayer.posX, 
      posY: thisPlayer.posY,
      vx: thisPlayer.vx,
      vy: thisPlayer.vy,
      blueprint: data.blueprint
    };
    socket.to(room).broadcast.emit('serverSendCreateCompound', newCompound);
    socket.to(room).emit('serverSendCreateCompound', newCompound);
  });

  socket.on('disconnect', data => {
    console.log('[Server]'.bold.blue + " Disconnect Received: ".red + ('' + socket.id).yellow + ': ' + data );
    
    socket.to(room).broadcast.emit('disconnectedPlayer', {id: socket.id}); //Broadcast to everyone in the room to delete the player
    
    delete rooms[room].players[socket.id]; //Remove the server side player

    // Delete room if there is nobody inside
    if(Object.keys(rooms[room].players).length === 0)  {
      console.log('[Server] '.bold.blue + 'Closing room '.red + (room + '').bold.red);
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

/**
 * Returns a random number between between 10000000 and 99999999, inclusive.
 * TODO Make every ID guaranteed unique
 */
function generateID() {
  return Math.floor(Math.random() * 90000000) + 10000000;
}