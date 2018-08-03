const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
import colors from 'colors'; // Console colors :D
import {GLOBAL, distanceBetween, isInBounds} from '../client/js/global.js';
import { MAP_LAYOUT, TILES, TILE_NAMES } from '../client/js/obj/tiles.js';
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


// Set up atom spawning three times a second. This is processed outside of the player specific behavior because more players joining !== more resources spawn.
setInterval(() => {
    for(let room in rooms) {
        for (let row = 0; row < MAP_LAYOUT.length; row++)
            for (let col = 0; col < MAP_LAYOUT[0].length; col++) {
                if (TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].type === 'spawner') {
                    spawnAtom(row, col, room, false);
                }
    
            }
    }
}, GLOBAL.ATOM_SPAWN_DELAY);

// Timer
setInterval(() => {
    for(let room in rooms) {
        if(rooms[room].started) {
            rooms[room].time.seconds++;
            if(rooms[room].time.seconds >= 60) {
                rooms[room].time.seconds = 0;
                rooms[room].time.minutes++;
            }

            rooms[room].time.formattedTime = rooms[room].time.minutes + ':' + ((rooms[room].time.seconds < 10) ? '0' : '') + rooms[room].time.seconds;
        }
    }
}, 1000);

// Initialize all socket listeners when a request is established
io.on('connection', socket => {
    // Determine room if matchmaking is needed
    let room = socket.handshake.query.room;

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
                if((roomType === '4v4' && rooms[roomName].teams.length < 2) || rooms[roomName].teams.length < 4) {
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

    // Join custom room
    socket.join(room, () => {
        console.log('[Server] '.bold.blue + `Player ${socket.handshake.query.name} (${socket.id}) joined room ${room} in team ${socket.handshake.query.team}`.yellow);
    });

    // Player team name
    team = socket.handshake.query.team;

    // Initialize room array and spawn atoms on first player join
    if(rooms[room] === undefined || rooms[room] === null) {
        console.log('[Server] '.bold.blue + 'Setting up room '.yellow + ('' + room).bold.red + ' as type ' + socket.handshake.query.roomType);
        rooms[room] = {};
        rooms[room].teams = [];
        rooms[room].players = {};
        rooms[room].atoms = {};
        rooms[room].compounds = {};
        rooms[room].type = socket.handshake.query.roomType;
        rooms[room].time = {
            minutes: 0,
            seconds: 0,
            formattedTime: '0:00'
        };

        // Generate Atoms. Atoms have a random ID between 10000000 and 99999999, inclusive.
        // for(let num = 0; num < Math.floor(Math.random() * (GLOBAL.MAX_POWERUPS - GLOBAL.MIN_POWERUPS) + GLOBAL.MIN_POWERUPS); num++) {
        //     // let type = GLOBAL.ATOM_IDS[Math.floor(Math.random() * GLOBAL.ATOM_IDS.length)];
        //     let type = 'h'; //TODO
        //     let randX = Math.random() * GLOBAL.MAP_SIZE * 2 - GLOBAL.MAP_SIZE;
        //     let randY = Math.random() * GLOBAL.MAP_SIZE * 2 - GLOBAL.MAP_SIZE;
        //     let atom = {
        //         typeID: type,
        //         id: generateID(),
        //         posX: randX,
        //         posY: randY,
        //         vx: 0,
        //         vy: 0
        //     };
        //     rooms[room].atoms[atom.id] = atom;
        // }
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
    rooms[room].teams.push(team);
 
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
                if(isInBounds(rooms[room].compounds[compound])) {
                    rooms[room].compounds[compound].posX += rooms[room].compounds[compound].vx;
                    rooms[room].compounds[compound].posY += rooms[room].compounds[compound].vy;
                }
                else { // delete
                    socket.to(room).broadcast.emit('serverSendCompoundRemoval', {id: compound});
                    socket.emit('serverSendCompoundRemoval', {id: compound});
                    delete rooms[room].compounds[compound];
                }
            }
            // Move atoms
            for(let atom in rooms[room].atoms) {
                let distance = distanceBetween(
                    { posX: rooms[room].atoms[atom].posX + GLOBAL.ATOM_RADIUS, posY: rooms[room].atoms[atom].posY - GLOBAL.ATOM_RADIUS },
                    { posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS });
                // Attractive force
                if (distance < GLOBAL.ATTRACTION_RADIUS) {
                    let theta = Math.atan2((thisPlayer.posY - rooms[room].atoms[atom].posY), (thisPlayer.posX - rooms[room].atoms[atom].posX));
                    // rooms[room].atoms[atom].vx += 1 / (thisPlayer.posX - rooms[room].atoms[atom].posX) * GLOBAL.ATTRACTION_COEFFICIENT;
                    // rooms[room].atoms[atom].vy += 1 / (thisPlayer.posY - rooms[room].atoms[atom].posY) * GLOBAL.ATTRACTION_COEFFICIENT;
                    rooms[room].atoms[atom].vx = 1/distance * Math.cos(theta) * GLOBAL.ATTRACTION_COEFFICIENT;
                    rooms[room].atoms[atom].vy = 1/distance * Math.sin(theta) * GLOBAL.ATTRACTION_COEFFICIENT;
                    // console.log(this.vx, this.vy, this.posX, this.posY);
                    // socket.emit('move', { type: 'atoms', id: this.id, posX: this.posX, posY: this.posY, vx: this.vx, vy: this.vy });
                }
                else if (Math.abs(rooms[room].atoms[atom].vx) > GLOBAL.DEADZONE || Math.abs(rooms[room].atoms[atom].vy) > GLOBAL.DEADZONE) {
                    rooms[room].atoms[atom].vx *= GLOBAL.VELOCITY_STEP;
                    rooms[room].atoms[atom].vy *= GLOBAL.VELOCITY_STEP;
                }

                if (Math.abs(rooms[room].atoms[atom].vx) <= GLOBAL.DEADZONE)
                    rooms[room].atoms[atom].vx = 0;
                if (Math.abs(rooms[room].atoms[atom].vy) <= GLOBAL.DEADZONE)
                    rooms[room].atoms[atom].vy = 0;

                rooms[room].atoms[atom].posX += rooms[room].atoms[atom].vx;
                rooms[room].atoms[atom].posY += rooms[room].atoms[atom].vy;
            }

            for(let objType in tempObjects) {
                for (let obj in rooms[room][objType])
                    if(distanceBetween(rooms[room][objType][obj], thisPlayer) < GLOBAL.DRAW_RADIUS)
                        tempObjects[objType][obj] = rooms[room][objType][obj];
            }

            // // Populate tiles
            // tempObjects.tiles = [];
            // for(let row = 0; row < MAP_LAYOUT.length; row++) {
            //   for(let col = 0; col < MAP_LAYOUT[0].length; col++)
            //     if(distanceBetween(thisPlayer, {
            //       posX: col * GLOBAL.GRID_SPACING * 2,
            //       posY: row * GLOBAL.GRID_SPACING * 2
            //     }) < GLOBAL.DRAW_RADIUS)
            //       tempObjects.tiles.push({
            //         row: row,
            //         col: col
            //       });
            // }

            socket.emit('objectSync', tempObjects);

            if(rooms[room].started)
                socket.emit('time', {time: rooms[room].time.formattedTime});
      
            if(rooms[room] !== undefined && !rooms[room].started) {
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
   
    socket.to(room).broadcast.emit('serverSendLoginMessage', {
        sender: socket.id
    });
    if(DEBUG) {
        socket.to(room).broadcast.emit('serverMSG', 'You are connected to a DEBUG enabled server. ');
    }

    // Hides the lobby screen if the game has already started
    if(rooms[room].started) {
        socket.emit('serverSendStartGame', {});
    }

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

            damage(data, room, socket);   
        }
    });

    socket.to(room).on('damage', data => {
        damage(data, room, socket);
    });

    // A player spawned a Compound
    socket.to(room).on('createCompound', data => {
    // Calculate velocities based on cursor position
        let theta = Math.atan2(data.mousePos.y,data.mousePos.x);
        let newCompound = {
            id: generateID(),
            posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, 
            posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS,
            vx: data.blueprint.params.speed * Math.cos(theta),
            vy: data.blueprint.params.speed * Math.sin(theta),
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

    socket.on('spawnAtom', (data) => {
        spawnAtom(data.row, data.col, room, true);
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

/**
 * Changes the health of the player by the amount given.
 * @param {*} data The data sent by the client.
 * @param {string} room This room.
 * @param {*} socket This socket.
 * Must include the player id and amount to damage.
 * Amount may be negative (for health boost).
 */
function damage(data, room, socket) {
    if(rooms[room].players[data.sender] !== undefined) {
        rooms[room].players[data.sender].health -= data.damage;

        if (rooms[room].players[data.sender].health <= 0) {
            console.log(rooms[room].teams.indexOf(socket.handshake.query.team));
            socket.emit('serverSendPlayerDeath', {teamNumber: rooms[room].teams.indexOf(socket.handshake.query.team)});
            rooms[room].players[data.sender].health = GLOBAL.MAX_HEALTH;
        }
    }
    else
        console.warn('Player of ID ' + data.id + ' couldn\'t be damaged because they don\'t exist!');
}

/**
 * 
 * @param {number} row The row of the vent 
 * @param {number} col The column of the vent to spawn at
 * @param {string} room The room to spawn in
 * @param {boolean} verbose True if this method should output to the console
 */
function spawnAtom(row, col, room, verbose) {
    // Atom to spawn. Gets a random element from the tile paramter array `atomsToSpawn`
    let atomToSpawn = TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].params.atomsToSpawn[Math.floor(Math.random() * TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].params.atomsToSpawn.length)];
    let theta = Math.random() * Math.PI * 2; // Set random direction for atom to go in once spawned
    let x = col * GLOBAL.GRID_SPACING * 2 + GLOBAL.GRID_SPACING;
    let y = row * GLOBAL.GRID_SPACING * 2 - GLOBAL.GRID_SPACING;
     
    let atom = {
        typeID: atomToSpawn,
        id: generateID(),
        posX: x,
        posY: y,
        vx: Math.cos(theta) * GLOBAL.ATOM_SPAWN_SPEED,
        vy: Math.sin(theta) * GLOBAL.ATOM_SPAWN_SPEED
    };
    if (rooms[room] !== undefined)
        rooms[room].atoms[atom.id] = atom;

    // Log to console
    if(verbose)
        console.log('SPAWN ATOM ' + atomToSpawn + ' theta:' + theta + ', vx: ' + atom.vx + ', vy: ' + atom.vy);
}
