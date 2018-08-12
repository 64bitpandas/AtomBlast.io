const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
import colors from 'colors'; // Console colors :D
import {GLOBAL, distanceBetween, isInBounds} from '../client/js/global.js';
import { MAP_LAYOUT, TILES, TILE_NAMES } from '../client/js/obj/tiles.js';
import { roomMatchmaker } from './matchmaker.js';
import { generateID } from './serverutils.js';
var config = require('./config.json');

const DEBUG = true;
const COLLISIONVERBOSE = false; // Turn on for debug messages with collision detection

app.use(express.static(`${__dirname}/../client`));

/* Contains all game data, including which rooms and players are active.
 * 
 * Structure of Rooms object:
 * 
// rooms = {
//     roomName: {
//         joinable: true,
//         type: '4v4',
//         teams: [
//             name: 'teamname',
//             players: [...]
//         ],
//         players: {...},
//         atoms: {...},
//         compounds: {...},
//         time: {
//             minutes: 0,
//             seconds: 0,
//             formattedTime: '0:00'
//         }
//     }
// }
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
                    spawnAtomAtVent(row, col, room, false);
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

    let team = socket.handshake.query.team;

    // Run matchmaker
    roomMatchmaker(socket, room, teams[team]);

    // Player team name

    // Initialize room array and spawn atoms on first player join
    if(rooms[room] === undefined || rooms[room] === null) {
        console.log('[Server] '.bold.blue + 'Setting up room '.yellow + ('' + room).bold.red + ' as type ' + socket.handshake.query.roomType);
        rooms[room] = {};
        rooms[room].joinable = true;
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
    }
    
    // Add team to database
    rooms[room].teams.push({name: team});

    // Check if room is full
    if(((rooms[room].type === '4v4' || rooms[room].type === '2v2') && rooms[room].players.length === 2) || rooms[room].players.length === 4)
        rooms[room].joinable = false;

    // Create new player in rooms object
    rooms[room].players[socket.id] = {
        id: socket.id, 
        name: socket.handshake.query.name, 
        room: socket.handshake.query.room,
        team: socket.handshake.query.team,
        health: GLOBAL.MAX_HEALTH,
        posX: GLOBAL.SPAWN_POINTS[rooms[room].teams.length - 1].x * GLOBAL.GRID_SPACING * 2,
        posY: GLOBAL.SPAWN_POINTS[rooms[room].teams.length - 1].y * GLOBAL.GRID_SPACING * 2,
        vx: 0,
        vy: 0,
        experience: 0,
        damagedBy: {}
    };
    let thisPlayer = rooms[room].players[socket.id];
    // console.log(thisPlayer);
 
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
                    socket.to(room).broadcast.emit('serverSendObjectRemoval', {id: compound, type: 'compounds'});
                    socket.emit('serverSendObjectRemoval', {id: compound, type: 'compounds'});
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
                for (let obj in rooms[room][objType]) {
                    if(distanceBetween(rooms[room][objType][obj], thisPlayer) < GLOBAL.DRAW_RADIUS)
                        tempObjects[objType][obj] = rooms[room][objType][obj];
                    else if(objType === 'players') // Player left view
                        socket.emit('serverSendObjectRemoval', {id: obj, type: objType});
                }
            }

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
        socket.emit('serverSendStartGame', {teams: rooms[room].teams});
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
        socket.to(room).broadcast.emit('serverSendObjectRemoval', {id: data.id, type: 'atoms'});
    });

    socket.to(room).on('compoundCollision', data => {
        if (COLLISIONVERBOSE) {
            console.log('compoundCollision');
        }
        if(rooms[room].compounds[data.id] !== undefined) {
            damage(data, room, socket);   
            delete rooms[room].compounds[data.id];
            socket.to(room).broadcast.emit('serverSendObjectRemoval', {id: data.id, type: 'compounds'});
            socket.emit('serverSendObjectRemoval', {id: data.id, type: 'compounds'});

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
            sendingTeam: data.sendingTeam,
            sender: data.sender
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

    socket.on('startGame', data => {
        console.log('Game has started in room ' + room);
        // Make the room and teams unjoinable
        for(let tm of rooms[room].teams) {
            teams[tm.name].joinable = false;
        }
        rooms[room].joinable = false;

        socket.broadcast.to(room).emit('serverSendStartGame', {start: data.start, teams: rooms[room].teams});
        socket.emit('serverSendStartGame', {start: data.start, teams: rooms[room].teams});
        rooms[room].started = true;
    });

    socket.on('spawnAtom', (data) => {
        spawnAtomAtVent(data.row, data.col, room, true);
    });

    // Atom information sent on player death. Spreads atoms randomly in a circle around the death area.
    socket.on('playerDeathAtoms', (data) => {
        for(let at in data.atoms) {
            for(let i = 0; i < GLOBAL.MAX_DEATH_ATOMS && i < data.atoms[at]; i++)
                spawnAtom(data.x, data.y, at, room, false);
        }
    });



    socket.on('disconnect', data => {
        console.log('[Server]'.bold.blue + ' Disconnect Received: '.red + ('' + socket.id).yellow + ('' + rooms[room].players[socket.id]).green + ': ' + data);

        socket.to(room).broadcast.emit('disconnectedPlayer', { id: socket.id }); //Broadcast to everyone in the room to delete the player

        delete rooms[room].players[socket.id]; //Remove the server side player

        // Delete room if there is nobody inside
        if (Object.keys(rooms[room].players).length === 0) {
            console.log('[Server] '.bold.blue + 'Closing room '.red + (room + '').bold.red);
            delete io.sockets.adapter.rooms[socket.id];
            delete rooms[room];

            if (room !== GLOBAL.NO_ROOM_IDENTIFIER) {
                // Remove from teams array
                teams[team].players.splice(teams[team].players.indexOf(socket.id), 1);

                // Delete team if all players have left
                if (teams[team].players.length === 0)
                    delete teams[team];

            }
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
 * Changes the health of the player by the amount given.
 * @param {*} data The data sent by the client.
 * @param {string} room This room.
 * @param {*} socket This socket.
 * Must include the player id and amount to damage.
 * Amount may be negative (for health boost).
 */
function damage(data, room, socket) {
    if(rooms[room].players[data.player] !== undefined) {
        rooms[room].players[data.player].health -= data.damage;

        // Add damage to database
        if (rooms[room].players[data.player].damagedBy[data.sentBy] === undefined)
            rooms[room].players[data.player].damagedBy[data.sentBy] = 0;
        rooms[room].players[data.player].damagedBy[data.sentBy] += data.damage;

        if (rooms[room].players[data.player].health <= 0) {
            // console.log(rooms[room].teams.indexOf(socket.handshake.query.team));
            socket.emit('serverSendPlayerDeath', {teamNumber: getTeamNumber(room, socket.handshake.query.team)});
            rooms[room].players[data.player].health = GLOBAL.MAX_HEALTH;

            // Read damagedBy to award points, clear in the process
            let max = null;
            let dataToSend;
            for(let pl in rooms[room].players[data.player].damagedBy) {
                dataToSend = { 
                    player: pl, 
                    teamSlot: getTeamNumber(room, rooms[room].compounds[data.id].sendingTeam), 
                    increment: GLOBAL.ASSIST_SCORE, 
                    kill: false };

                // Init team score if it hasn't been previously
                if (rooms[room].teams[dataToSend.teamSlot].score === undefined)
                    rooms[room].teams[dataToSend.teamSlot].score = 0;
                
                // Add to team score
                rooms[room].teams[dataToSend.teamSlot].score += dataToSend.increment;

                
                socket.to(room).broadcast.emit('serverSendScoreUpdate', dataToSend);
                socket.emit('serverSendScoreUpdate', dataToSend);
                if (max === null || rooms[room].players[data.player].damagedBy[pl] > rooms[room].players[data.player].damagedBy[max])
                    max = pl;
            }

            // Add to score of person who dealt the most damage
            dataToSend.player = max;
            dataToSend.increment = GLOBAL.KILL_SCORE - GLOBAL.ASSIST_SCORE;
            dataToSend.kill = true;
            socket.to(room).broadcast.emit('serverSendScoreUpdate', dataToSend);
            socket.emit('serverSendScoreUpdate', dataToSend);

            // Add to team score
            rooms[room].teams[dataToSend.teamSlot].score += dataToSend.increment;

            // Clear damagedBy values
            for (let pl in rooms[room].players[data.player].damagedBy)
                rooms[room].players[data.player].damagedBy[pl] = 0;

            // Check if a team won
            for(let tm of rooms[room].teams) {
                if(tm.score >= GLOBAL.WINNING_SCORE) {

                    let dataToSend = {
                        winner: tm
                        // teamScore: rooms[room].teams[dataToSend.teamSlot].score             
                        //other data here TODO post ranking
                    };
                    socket.to(room).broadcast.emit('serverSendWinner', dataToSend); 
                    socket.emit('serverSendWinner', dataToSend); 

                    // Close room after delay (kick all players)
                    setTimeout(() => {
                        socket.emit('serverSendDisconnect', {});
                        socket.to(room).broadcast.emit('serverSendDisconnect', {});
                    },GLOBAL.ROOM_DELETE_DELAY);
                }
            }
        }
    }
    else
        console.warn('Player of ID ' + data.id + ' couldn\'t be damaged because they don\'t exist!');
}

/**
 * Spawns an atom at the vent at the given row and column.
 * @param {number} row The row of the vent 
 * @param {number} col The column of the vent to spawn at
 * @param {string} room The room to spawn in
 * @param {boolean} verbose True if this method should output to the console
 */
function spawnAtomAtVent(row, col, room, verbose) {
    // Atom to spawn. Gets a random element from the tile paramter array `atomsToSpawn`
    let atomToSpawn = TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].params.atomsToSpawn[Math.floor(Math.random() * TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].params.atomsToSpawn.length)];

    let x = col * GLOBAL.GRID_SPACING * 2 + GLOBAL.GRID_SPACING;
    let y = row * GLOBAL.GRID_SPACING * 2 - GLOBAL.GRID_SPACING;
     
    spawnAtom(x, y, atomToSpawn, room, verbose);
    
}

/**
 * 
 * @param {number} x X-position of center
 * @param {number} y Y-position of center
 * @param {string} type Type of atom to spawn
 * @param {string} room The room to spawn in
 * @param {boolean} verbose True if this method should output to the console
 */
function spawnAtom(x, y, type, room, verbose) {

    let theta = Math.random() * Math.PI * 2; // Set random direction for atom to go in once spawned

    let atom = {
        typeID: type,
        id: generateID(),
        posX: x,
        posY: y,
        vx: Math.cos(theta) * GLOBAL.ATOM_SPAWN_SPEED,
        vy: Math.sin(theta) * GLOBAL.ATOM_SPAWN_SPEED
    };
    if (rooms[room] !== undefined)
        rooms[room].atoms[atom.id] = atom;

    // Log to console
    if (verbose)
        console.log('SPAWN ATOM ' + atomToSpawn + ' theta:' + theta + ', vx: ' + atom.vx + ', vy: ' + atom.vy);
}

/**
 * Returns the index of the given team within the team array of the given room.
 * @param {string} room The room name to check
 * @param {string} teamName The team name to return the number of
 */
function getTeamNumber(room, teamName) {
    for(let i = 0; i < rooms[room].teams.length; i++)
        if(rooms[room].teams[i].name === teamName)
            return i;
    
    return -1; //Team not found
}

/**
 * Sets a new value for a protected server field.
 * Adopted from https://stackoverflow.com/questions/18936915/dynamically-set-property-of-nested-object
 * @param {*} value The value to set
 * @param {*} path Array containing all of the subobject identifiers, with the 0th index being the lowest level. 
 *                 Example: rooms.myRoom.players could be accessed through a path value of ['rooms', 'myRoom', 'players']
 */
export function setField(value, path) {
    console.log('path is ', path);

    if(path === undefined || path.length === 0)
        throw new Error('Error in setField: path cannot be empty');
    
    let schema = (path[0] === 'rooms') ? rooms : (path[0] === 'teams') ? teams : undefined;
    if (schema === undefined)
        throw new Error('Base object ' + path[0] + ' does not exist!');

    let len = path.length;
    for (let i = 1; i < len - 1; i++) {
        let elem = path[i];
        if (!schema[elem]) schema[elem] = {};
        schema = schema[elem];
    }

    schema[path[len - 1]] = value;

}

/**
 * Returns the value given a path to that value.
 * Adopted from https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
 * @param {*} path Array containing all of the subobject identifiers, with the 0th index being the lowest level.
 *                 Example: rooms.myRoom.players could be accessed through a path value of ['rooms', 'myRoom', 'players']
 * @returns The value for the given field.
 */
export function getField(path) {
    if (path === undefined || path.length === 0)
        throw new Error('Error in setField: path cannot be empty');
    
    let obj = (path[0] === 'rooms') ? rooms : (path[0] === 'teams') ? teams : undefined;
    if(obj === undefined)
        throw new Error('Base object ' + path[0] + ' does not exist!');

    return path.reduce((prev, curr) => {
        return prev ? prev[curr] : undefined;
    }, obj || self);
}