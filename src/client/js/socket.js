import { GLOBAL, distanceBetween } from './global';
import { cookieInputs, quitGame, updateLobby, updateScores, showElement, hideElement, displayWinner, updateAtomList } from './app';
import ChatClient from './lib/chat-client';
import { loadTextures, app, createPlayer, isSetup, showGameUI, startGame, player, setIngame } from './pixigame';
import { MapTile } from './obj/maptile';
import { MAP_LAYOUT } from './obj/tiles';
import { createRenderAtom, createRenderCompound } from './obj/create';

/**
 * Socket.js contains all of the clientside networking interface.
 * It contains all variables which are synced between client and server.
 */

// Socket.io instance
export var socket;

/* Object containing all synced objects. Contains nested objects, which correspond to different types
 * (for example, objects[atoms], objects[players], objects[compounds])
 */
export var objects = {
	players: {},
	atoms: {},
	compounds: {},
	tiles: {}
};

/**
 * Attempts to connect to the server. Run on 'start game' press.
 *  - Manages connecting to main server vs. devserver
 *  - Sets up socket listeners
 *  - Loads textures
 *  - Loads pixi
 */
export function beginConnection() {
	//Joins debug server if conditions are met
	let room = (cookieInputs[7].value === 'private' ? cookieInputs[1].value : GLOBAL.NO_ROOM_IDENTIFIER);
	if (cookieInputs[1].value === 'test') {
		console.info('Connecting to: ' + GLOBAL.TEST_IP);
		// DEVELOPMENT server - auto deploy from pixi branch
		socket = io.connect(GLOBAL.TEST_IP, {
			query: `room=${room}&name=${cookieInputs[0].value}&team=${cookieInputs[2].value}&roomType=${cookieInputs[7].value}`,
			reconnectionAttempts: 3
		});
	}
	else if (cookieInputs[1].value === 'jurassicexp') {
		console.log('Dev Backdoor Initiated! Connecting to devserver');
		// Local server
		socket = io.connect(GLOBAL.LOCAL_HOST, {
			query: `room=${room}&name=${cookieInputs[0].value}&team=${cookieInputs[2].value}&roomType=${cookieInputs[7].value}`,
			reconnectionAttempts: 3
		});
	}
	else {
		// Production server
		console.log('connecting to main server');
		socket = io.connect(GLOBAL.SERVER_IP, {
			query: `room=${room}&name=${cookieInputs[0].value}&team=${cookieInputs[2].value}&roomType=${cookieInputs[7].value}`,
			reconnectionAttempts: 3
		});
	}

	socket.on('connect', () => {
		setupSocket();
		// Init pixi
		loadTextures();
		if (typeof app !== undefined) {
			app.start();
		}
	});
}

/**
 * Run on disconnect to reset all server-based variables and connections
 */
export function disconnect() {
	app.stop();
	socket.disconnect();

	// Wipe objects list
	for (let objType in objects)
		objects[objType] = {};

}

/** 
 * First time setup when connection starts. Run on connect event to ensure that the socket is connected first.
 */
function setupSocket() {

	//Debug
	console.log('Socket:', socket);

	//Instantiate Chat System
	let chat = new ChatClient({ player: cookieInputs[0].value, room: cookieInputs[1].value, team: cookieInputs[2].value });
	chat.addLoginMessage(cookieInputs[0].value, true);
	chat.registerFunctions();

	// Setup listeners
	setupSocketConnection();
	setupSocketInfo(chat);
	setupSocketObjectRetrieval();

	//Emit join message,
	socket.emit('playerJoin', { sender: chat.player, team: chat.team });
}


/**
 * Sets up socket object syncing.
 * Run in setupSocket().
 */
function setupSocketObjectRetrieval() {
    // Syncs all objects from server once a frame
    socket.on('objectSync', (data) => {
        for (let objType in data) {
            if (objType !== 'tiles') {
                for (let obj in data[objType]) {
                    if (data[objType][obj] !== null) {
                        let objRef = data[objType][obj];
                        let clientObj = objects[objType][obj];
                        // Already exists in database
                        if (clientObj !== undefined && clientObj !== null) {
                            if (objRef.id !== socket.id)
                                objects[objType][obj].setData(objRef.posX, objRef.posY, objRef.vx, objRef.vy);
                            if (objType === 'players') {
                                objects[objType][obj].health = objRef.health;
                                objects[objType][obj].damagedBy = objRef.damagedBy;
                                objects[objType][obj].atomList = objRef.atomList;
                                objects[objType][obj].speedMult = objRef.speedMult;
                                objects[objType][obj].hasShield = objRef.hasShield;
                                for (let atom in objRef.atomList)
                                    updateAtomList(atom);
                            }
                            if (objType === 'compounds' && objRef.ignited) 
                                objects[objType][obj].ignited = objRef.ignited;
                        }
                        // Does not exist - need to clone to clientside
                        else if (isSetup) {
                            switch (objType) {
                                case 'players':
                                    objects[objType][obj] = createPlayer(objRef);
                                    break;
                                case 'atoms':
                                    objects[objType][obj] = createRenderAtom(objRef);
                                    break;
                                case 'compounds':
                                    objects[objType][obj] = createRenderCompound(objRef);
                                    break;
                            }
                        }
                    }
                }
            }
            // else { //Tile drawing
            //     for (let tile of data.tiles) {

            //         let tileName = 'tile_' + tile.col + '_' + tile.row;
            //         if (objects.tiles[tileName] === undefined) {
            //             // console.log(tileName);
            //             objects.tiles[tileName] = new MapTile(MAP_LAYOUT[tile.row][tile.col], tile.col, tile.row);
            //         }

            //     }
            // }

        }

    });

    // Sync objects when they are deleted or move out of view
    socket.on('serverSendObjectRemoval', (data) => {
        if (GLOBAL.VERBOSE_SOCKET) {
            console.info("serverSendObjectRemoval() called");
        }
        if (objects[data.type][data.id] === undefined || objects[data.type][data.id] === null) {
            console.warn("serverSendObjectRemoval() called on invalid object.");
            return 1;
        }
        // console.log(objects[data.type][data.id].destroyed);
        //An object was removed
        if (!objects[data.type][data.id].destroyed) {   //Only remove if not already
            removeObject(data);
        } 
        else {
            console.warn("serverSendObjectRemoval() called despite object has already been destroyed.");  // Sanity check
            return 1;
        }
        

		// Must keep checking if the object was not created at time of destruction.
		// One example of this needing to be run is when a player instantly collects an atom on spawn.
		if (objects[data.type][data.id] === undefined) {
			let thisInterval = setTimeout(() => {
				if (objects[data.type][data.id].destroyed) {
					clearInterval(thisInterval);
				} 
				else {
					removeObject(data); 
				}
			}, 200);
		}
	});

}

/**
 * Sets up socket connection listeners.
 * Run in setupSocket().
 */
function setupSocketConnection() {
	// On Connection Failure
	socket.on('reconnect_failed', () => {
		alert('You have lost connection to the server!');
	});

	socket.on('reconnecting', (attempt) => {
		console.log('Lost connection. Reconnecting on attempt: ' + attempt);
		quitGame('Lost connection to server');
	});

	socket.on('reconnect_error', (err) => {
		console.log('CRITICAL: Reconnect failed! ' + err);
	});

	socket.on('pong', (ping) => {
		console.log('Your Ping Is: ' + ping);
	});

	socket.on('disconnectedPlayer', (data) => {
		console.log('Player ' + data.id + ' has disconnected');
		chat.addSystemLine('Player ' + objects.players[data.id].name + ' has disconnected');
		if (objects.players[data.id] !== undefined) {
			objects.players[data.id].hide();
			delete objects.players[data.id];
		}
	});

	socket.on('serverSendDisconnect', () => {
		quitGame('The game has ended.', false);
		hideElement('winner-panel');
	});

	// Errors on join
	socket.on('connectionError', (data) => {
		socket.disconnect();
		quitGame(data.msg, true);
	});
}

/**
 * Sets up socket information transfer listeners.
 * Run in setupSocket().
 * @param {*} chat The chat client instance to be used for notifications
 */
function setupSocketInfo(chat) {
	//Chat system receiver
	socket.on('serverMSG', data => {
		chat.addSystemLine(data);
	});

	socket.on('serverSendPlayerChat', data => {
		chat.addChatLine(data.sender, data.message, false);
	});

	socket.on('serverSendLoginMessage', data => {
		chat.addLoginMessage(data.sender, false);
	});

	// Receive information about room players
	socket.on('roomInfo', (data) => {
		// Update lobby info. Pass to app.js
		updateLobby(data);

		// if(GLOBAL.DEBUG) {
		//     console.log("rcvd: ",data);
		// }
	});

	socket.on('serverSendStartGame', (data) => {
		console.log('game has started');
		startGame(false, data.teams);
	});

	socket.on('levelUp', (data) => {
		console.log('You LEVELED UP! Level: ' + data.newLevel);
	});

	// Respawn
	socket.on('serverSendPlayerDeath', (data) => {
		console.log('You Died!');

		// TODO move trigger to server
		// Releases atoms and deletes the entire atoms array in player
		socket.emit('playerDeathAtoms', { atoms: player.atoms, x: player.posX, y: player.posY });
		for (let at in player.atoms) {
			player.atoms[at] = 0;
			updateAtomList(at);
		}

		// Reset position to spawnpoint
		player.posX = GLOBAL.SPAWN_POINTS[data.teamNumber].x * GLOBAL.GRID_SPACING * 2;
		player.posY = GLOBAL.SPAWN_POINTS[data.teamNumber].y * GLOBAL.GRID_SPACING * 2;
		socket.emit('move', {
			id: socket.id,
			posX: player.posX,
			posY: player.posY,
			vx: 0,
			vy: 0,
			type: 'players'
		});

	});

	// Another player died
	socket.on('serverSendNotifyPlayerDeath', (data) => {
		// Append to chat
	});

	// Update timer
	socket.on('time', (data) => {
		document.getElementById('timer').innerHTML = '<p>' + data.time + '</p>';
	});

	// Update scores
	socket.on('serverSendScoreUpdate', (data) => {
		updateScores(data.teamSlot, data.increment);
	});

	// A player has won
	socket.on('serverSendWinner', (data) => {
		setIngame(false); // Disable keyboard controls and rendering
		displayWinner(data);
	});
}

/*
 ********************
 * Helper Functions *
 ********************
 */

// Linear Interpolation function. Adapted from p5.lerp
function lerp(v0, v1, t) {
	return v0 * (1 - t) + v1 * t;
}

// Helper function for serverSendObjectRemoval
function removeObject(data) {
	if (objects[data.type][data.id] !== undefined && objects[data.type][data.id] !== null) {
		objects[data.type][data.id].hide();
		objects[data.type][data.id].destroy();
		// delete objects[data.type][data.id];
	}
}