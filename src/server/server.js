const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
import colors from 'colors'; // Console colors :D
import {GLOBAL, distanceBetween} from '../client/js/global.js';
var config = require('./config.json');


const DEBUG = true;
const COLLISIONVERBOSE = false; // Turn on for debug messages with collision detection

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

/**
 * Teams object containing all the currently playing teams.
 * Structure:
 * teamName: {
 *    room: 'roomName',
 *    players: ['playerSocketId', 'player2SocketId', ...],
 *    joinable: false/true
 * }
 * 
 * -> Create a Team when the first player joins any lobby. Populate room when this occurs.
 * -> Change joinable to false when a Team is either full or the game has begun.
 * -> Delete the room from the database when the last player leaves.
 * -> There cannot be two teams with the same name. Throw an error if this occurs.
 */
let teams = {};

// Initialize all socket listeners when a request is established
io.on('connection', socket => {
    // Determine room if matchmaking is needed
    let room = socket.handshake.query.room;
    if(room === GLOBAL.NO_ROOM_IDENTIFIER) {
        let roomType = socket.handshake.query.roomType;
    
        // Check if the team already exists
        let team = teams[socket.handshake.query.team];
        if(team !== undefined) {
            // Make sure everything is compatible
            if(rooms[team.room].type !== roomType)
                socket.emit('connectionError', {msg: 'Your team is playing in a ' + rooms[team.room].type + ' room, but you are trying to join a ' + roomType + ' room!'});
            else if(!team.joinable)
                socket.emit('connectionError', {msg: 'Your team is already in game or full!'});
            else {// is joinable
                room = team.room;
                teams[socket.handshake.query.team].players.push(socket.id);
                if(roomType === '2v2v2v2' && team.players.length === 2)
                    teams[socket.handshake.query.team].joinable = false;
                else if(team.players.length === 4)
                    teams[socket.handshake.query.team].joinable = false;
            }
        } 
        // Team not found 
        else {
            // Try joining a room
            for(let roomName in rooms) {
                if(roomName.indexOf(roomType) > -1)
                    if((roomType === '4v4' && rooms[roomName].teamCount < 2) || rooms[roomName].teamCount < 4) {
                        rooms[roomName].teamCount++;
                        room = roomName;
                    }
            }

            // No matching rooms - must create a new room
            if(room === GLOBAL.NO_ROOM_IDENTIFIER)
                room = 'NA_' + roomType + '_' + generateID();

            // Make team
            teams[socket.handshake.query.team] = {
                room: room,
                players: [socket.id],
                joinable: true
            };
        }
      
    }

    // Join custom room
    socket.join(room, () => {
        console.log('[Server] '.bold.blue + `Player ${socket.handshake.query.name} (${socket.id}) joined room ${room} in team ${socket.handshake.query.team}`.yellow);
    });

    // Player team name
    let team = socket.handshake.query.team;

    // Initialize room array and spawn atoms on first player join
    if(rooms[room] === undefined || rooms[room] === null) {
        console.log('[Server] '.bold.blue + 'Setting up room '.yellow + ('' + room).bold.red + ' as type ' + socket.handshake.query.roomType);
        rooms[room] = {};
        rooms[room].teamCount = 0;
        rooms[room].players = {};
        rooms[room].atoms = {};
        rooms[room].compounds = {};
        rooms[room].type = socket.handshake.query.roomType;

        // Generate Atoms. Atoms have a random ID between 10000000 and 99999999, inclusive.
        for(let num = 0; num < Math.floor(Math.random() * (GLOBAL.MAX_POWERUPS - GLOBAL.MIN_POWERUPS) + GLOBAL.MIN_POWERUPS); num++) {
            // let type = GLOBAL.ATOM_IDS[Math.floor(Math.random() * GLOBAL.ATOM_IDS.length)];
            let type = 'h'; //TODO
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
        vy: 0,
        experience: 0
    };

    // Add team to database
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

            // Move compounds
            for(let compound in rooms[room].compounds) {
                rooms[room].compounds[compound].posX += rooms[room].compounds[compound].vx;
                rooms[room].compounds[compound].posY += rooms[room].compounds[compound].vy;
            }

            for(let objType in tempObjects) {
                for (let obj in rooms[room][objType])
                    if(distanceBetween(rooms[room][objType][obj], thisPlayer) < GLOBAL.DRAW_RADIUS)
                        tempObjects[objType][obj] = rooms[room][objType][obj];
            }

            socket.emit('objectSync', tempObjects);
      
            if(!rooms[room].started) {
                // Send over the room player information
                // socket.to(room).broadcast.emit('roomInfo', rooms[room].players);
                socket.emit('roomInfo', rooms[room].players);
            }
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
   *  - type: atoms, players, or compounds
   *  - posX: new x position
   *  - posY: new y position
   *  - vx: x-velocity
   *  - vy: y-velocity
   */
    socket.to(room).on('move', data => {
    // Player exists in database already because it was created serverside - no need for extra checking
        if(rooms[room][data.type][data.id] !== undefined) {
            rooms[room][data.type][data.id].posX = data.posX;
            rooms[room][data.type][data.id].posY = data.posY;
            rooms[room][data.type][data.id].vx = data.vx;
            rooms[room][data.type][data.id].vy = data.vy;
        }

    }); 

    socket.to(room).on('damage', data => {
        if(rooms[room].players[data.id] !== undefined){
            rooms[room].players[data.id].health -= data.damageAmount;
            console.log('Damage rcvd health left: '.green + rooms[room].players[data.id].health + ' From player: ' + data.id);
            if(rooms[room].players[data.id].health <=0) {
                console.log('[Server]'.bold.blue + ' Player destroyed: '.red + ('' + socket.id).yellow + ': ' + data );

                socket.to(room).broadcast.emit('disconnectedPlayer', {id: socket.id}); //Broadcast to everyone in the room to delete the player

                delete rooms[room].players[socket.id]; //Remove the server side player
            }
        }
    });

    // /**
    //  * On atom movement
    //  */
    // socket.to(room).on('atomMove', data => {
    //   if(rooms[room].atoms[data.id] !== undefined) {
    //     rooms[room].atoms[data.id].posX = data.posX;
    //     rooms[room].atoms[data.id].posY = data.posY;
    //     rooms[room].atoms[data.id].vx = data.vx;
    //     rooms[room].atoms[data.id].vy = data.vy;
    //   }
    // })

    // An atom was collected or changed
    socket.to(room).on('atomCollision', data => {
        if (COLLISIONVERBOSE) {
            console.log('atomCollision');
        }
        delete rooms[room].atoms[data.id];
        socket.to(room).broadcast.emit('serverSendAtomRemoval', data);
    });

    socket.to(room).on('compoundCollision', data => {
        if (COLLISIONVERBOSE) {
            console.log('compoundCollision');
        }
        if(rooms[room].compounds[data.id] !== undefined) {
            delete rooms[room].compounds[data.id];
            socket.to(room).broadcast.emit('serverSendCompoundRemoval', data);
            socket.emit('serverSendCompoundRemoval', data);
            rooms[room].players[data.sender].health -= data.damage;
        }
    });

    // A player spawned a Compound
    socket.to(room).on('createCompound', data => {
    // Calculate velocities based on cursor position
        let theta = Math.atan2(data.mousePos.y,data.mousePos.x);

        let newCompound = {
            id: generateID(),
            posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, 
            posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS,
            vx: thisPlayer.vx + data.blueprint.params.speed * Math.cos(theta),
            vy: thisPlayer.vy + data.blueprint.params.speed * Math.sin(theta),
            blueprint: data.blueprint,
            sendingTeam: data.sendingTeam
        };
        rooms[room].compounds[newCompound.id] = newCompound;
    // socket.to(room).broadcast.emit('serverSendCreateCompound', newCompound); //Send to everyone but the sender
    // socket.to(room).emit('serverSendCreateCompound', newCompound); //Send to the sender
    });

    //A Player has performed an action and gained experience
    socket.to(room).on('experienceEvent', data => {
    //data.event is the event that occured

    //Add a specific amount to the players experience
    //Get the index of the Event and then pass it into the values array to get the actual value
        thisPlayer.experience += GLOBAL.EXPERIENCE_VALUES[data.event];

        // Determine the player's level based on experience
        let oldLevel = thisPlayer.level;
        for(let level of GLOBAL.EXPERIENCE_LEVELS){
            if(thisPlayer.experience >= level)
                thisPlayer.level = GLOBAL.EXPERIENCE_LEVELS.indexOf(level) + 1;
        }

        // Check to see if the player leveled up
        if(thisPlayer.level > oldLevel) {
            socket.emit('levelUp', {newLevel: thisPlayer.level});
        }
    });

    socket.on('disconnect', data => {
        console.log('[Server]'.bold.blue + ' Disconnect Received: '.red + ('' + socket.id).yellow + ('' + rooms[room].players[socket.id]).green + ': ' + data);
    
        socket.to(room).broadcast.emit('disconnectedPlayer', {id: socket.id}); //Broadcast to everyone in the room to delete the player
    
        delete rooms[room].players[socket.id]; //Remove the server side player

        // Delete room if there is nobody inside
        if(Object.keys(rooms[room].players).length === 0)  {
            console.log('[Server] '.bold.blue + 'Closing room '.red + (room + '').bold.red);
            delete io.sockets.adapter.rooms[socket.id];
            delete rooms[room];

            if(room !== GLOBAL.NO_ROOM_IDENTIFIER)
                delete teams[team];
        }
    });

    socket.on('startGame', data => {
        console.log('Game has started in room ' + room);
        socket.broadcast.to(room).emit('serverSendStartGame', data);
        rooms[room].started = true;
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