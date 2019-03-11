import { GLOBAL } from './global'
import { cookieInputs, quitGame, updateLobby, updateScores, hideElement, displayWinner, updateAtomList } from './app'
import ChatClient from './lib/chat-client'
import { loadTextures, app, createPlayer, isSetup, startGame, setIngame, spritesheet } from './pixigame'
import { createRenderAtom, createRenderCompound } from './obj/create'

/**
 * Socket.js contains all of the clientside networking interface.
 * It contains all variables which are synced between client and server.
 */

// Socket.io instance
export var socket

/* Object containing all synced objects. Contains nested objects, which correspond to different types
 * (for example, objects[atoms], objects[players], objects[compounds])
 */
export var objects = {
	players: {},
	atoms: {},
	compounds: {},
	tiles: {}
}

/**
 * Team colors object. Number corresponds to index at GLOBAL.TEAM_COLORS.
 * Format: {
 * 	teamname1: 0,
 * 	teamname: colorid,
 * 	...
 * }
 */
export var teamColors = {}

/**
 * Attempts to connect to the server. Run on 'start game' press.
 *  - Manages connecting to main server vs. devserver
 *  - Sets up socket listeners
 *  - Loads textures
 *  - Loads pixi
 */
export function beginConnection () {
	// Joins debug server if conditions are met
	let room = (cookieInputs[7].value === 'private' ? cookieInputs[1].value : GLOBAL.NO_ROOM_IDENTIFIER)
	let teamInput = (document.querySelector('input[name="queue-type"]:checked').id === 'team-option') ? cookieInputs[2].value : GLOBAL.NO_TEAM_IDENTIFIER

	if (cookieInputs[1].value === 'test') {
		console.info('Connecting to: ' + GLOBAL.TEST_IP)
		// DEVELOPMENT server - auto deploy from pixi branch
		socket = io.connect(GLOBAL.TEST_IP, {
			query: `room=${room}&name=${cookieInputs[0].value}&team=${teamInput}&roomType=${cookieInputs[7].value}`,
			reconnectionAttempts: 3
		})
	}
	else if (cookieInputs[1].value === 'jurassicexp') {
		console.log('Dev Backdoor Initiated! Connecting to devserver')
		// Local server
		socket = io.connect(GLOBAL.LOCAL_HOST, {
			query: `room=${room}&name=${cookieInputs[0].value}&team=${teamInput}&roomType=${cookieInputs[7].value}`,
			reconnectionAttempts: 3
		})
	}
	else {
		// Production server
		console.log('connecting to main server')
		socket = io.connect(GLOBAL.SERVER_IP, {
			query: `room=${room}&name=${cookieInputs[0].value}&team=${teamInput}&roomType=${cookieInputs[7].value}`,
			reconnectionAttempts: 3
		})
	}

	socket.on('connect', () => {
		setupSocket()
		// Init pixi
		loadTextures()
		if (typeof app !== 'undefined') {
			app.start()
		}
	})
}

/**
 * Run on disconnect to reset all server-based variables and connections
 */
export function disconnect () {
	app.stop()
	socket.disconnect()

	// Wipe objects list
	for (let objType in objects) {
		objects[objType] = {}
	}
}

/**
 * First time setup when connection starts. Run on connect event to ensure that the socket is connected first.
 */
function setupSocket () {
	// Debug
	console.log('Socket:', socket)

	// Instantiate Chat System
	let chat = new ChatClient({ player: cookieInputs[0].value, room: cookieInputs[1].value, team: cookieInputs[2].value })
	chat.addLoginMessage(cookieInputs[0].value, true)
	chat.registerFunctions()

	// Setup listeners
	setupSocketConnection()
	setupSocketInfo(chat)
	setupSocketObjectRetrieval()

	// Emit join message,
	socket.emit('playerJoin', { sender: chat.player, team: chat.team })
}

/**
 * Sets up socket object syncing.
 * Run in setupSocket().
 */
function setupSocketObjectRetrieval () {
	// Syncs all objects from server once a frame
	socket.on('objectSync', (data) => {
		for (let objType in data) {
			if (objType !== 'tiles') {
				for (let obj in data[objType]) {
					if (data[objType][obj] !== null) {
						let objRef = data[objType][obj]
						let clientObj = objects[objType][obj]
						// Already exists in database
						if (clientObj !== undefined && clientObj !== null) {
							if (objRef.id !== socket.id) {
								objects[objType][obj].setData(objRef.posX, objRef.posY, objRef.vx, objRef.vy)
							}
							if (objType === 'players') {
								objects[objType][obj].health = objRef.health
								objects[objType][obj].damagedBy = objRef.damagedBy
								objects[objType][obj].atomList = objRef.atomList
								objects[objType][obj].speedMult = objRef.speedMult
								objects[objType][obj].hasShield = objRef.hasShield
								for (let atom in objRef.atomList) {
									updateAtomList(atom)
								}
							}
							if (objType === 'compounds' && objRef.ignited) {
								objects[objType][obj].ignited = objRef.ignited
							}
						}
						// Does not exist - need to clone to clientside
						else if (isSetup) {
							switch (objType) {
								case 'players':
									objects[objType][obj] = createPlayer(objRef)
									break
								case 'atoms':
									objects[objType][obj] = createRenderAtom(objRef)
									break
								case 'compounds':
									objects[objType][obj] = createRenderCompound(objRef)
									break
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
	})

	// Sync objects when they are deleted or move out of view. ONLY call after objectSync to avoid issue
	socket.on('serverSendObjectRemoval', (data) => {
		if (GLOBAL.VERBOSE_SOCKET) {
			console.info('serverSendObjectRemoval() called on: ')
			console.info(data)
			console.info(objects[data.type][data.id])
			console.info(objects)
		}
		if (objects[data.type][data.id] === undefined || objects[data.type][data.id] === null) {
			if (GLOBAL.VERBOSE_SOCKET) {
				console.warn('serverSendObjectRemoval() called on invalid object. Retry.', data)
			}
			setTimeout(() => {
				try {
					if (removeObject(data)) {
						if (GLOBAL.VERBOSE_SOCKET) {
							console.info('Retry successfully removed object. While this worked, it should not happen. Please fix root cause of issue. ')
						}
						return 0
					}
				}
				catch (err) {
					if (GLOBAL.VERBOSE_SOCKET) {
						console.error('Retry failed. Object removal failed. Abandoning request. ')
					}
					return 1
				}
				// removeObject(data);
			}, 1000 / 60)
			// return 1
		}
		else {
			// console.log(objects[data.type][data.id].destroyed);
		// An object was removed
			if (!objects[data.type][data.id].destroyed) { // Only remove if not already
				removeObject(data)
			}
			else {
				console.warn('serverSendObjectRemoval() called despite object has already been destroyed.') // Sanity check
				return 1
			}
		}

		// Must keep checking if the object was not created at time of destruction.
		// One example of this needing to be run is when a player instantly collects an atom on spawn.
		// if (objects[data.type][data.id] === undefined) {
		// 	let thisInterval = setTimeout(() => {
		// 		if (objects[data.type][data.id].destroyed) {
		// 			clearInterval(thisInterval)
		// 		}
		// 		else {
		// 			removeObject(data)
		// 		}
		// 	}, 200)
		// }
	})
}

/**
 * Sets up socket connection listeners.
 * Run in setupSocket().
 */
function setupSocketConnection () {
	// On Connection Failure
	socket.on('reconnect_failed', () => {
		alert('You have lost connection to the server!')
	})

	socket.on('reconnecting', (attempt) => {
		console.log('Lost connection. Reconnecting on attempt: ' + attempt)
		quitGame('Lost connection to server')
	})

	socket.on('reconnect_error', (err) => {
		console.log('CRITICAL: Reconnect failed! ' + err)
	})

	socket.on('pong', (ping) => {
		console.log('Your Ping Is: ' + ping)
	})

	socket.on('disconnectedPlayer', (data) => {
		console.log('Player ' + data.id + ' has disconnected')
		chat.addSystemLine('Player ' + objects.players[data.id].name + ' has disconnected')
		if (objects.players[data.id] !== undefined) {
			objects.players[data.id].hide()
			delete objects.players[data.id]
		}
	})

	socket.on('serverSendDisconnect', () => {
		quitGame('The game has ended.', false)
		hideElement('winner-panel')
	})

	// Errors on join
	socket.on('connectionError', (data) => {
		socket.disconnect()
		quitGame(data.msg, true)
	})
}

/**
 * Sets up socket information transfer listeners.
 * Run in setupSocket().
 * @param {*} chat The chat client instance to be used for notifications
 */
function setupSocketInfo (chat) {
	// Chat system receiver
	socket.on('serverMSG', data => {
		chat.addSystemLine(data)
	})

	socket.on('serverSendPlayerChat', data => {
		chat.addChatLine(data.sender, data.message, false)
	})

	socket.on('serverSendLoginMessage', data => {
		chat.addLoginMessage(data.sender, false)
	})

	// Receive information about room players
	socket.on('roomInfo', (data) => {
		// Update lobby info. Pass to app.js
		updateLobby(data)

		// if(GLOBAL.DEBUG) {
		//     console.log("rcvd: ",data);
		// }
	})

	socket.on('serverSendStartGame', (data) => {
		console.log('game has started')
		startGame(false, data.teams)
	})

	socket.on('levelUp', (data) => {
		console.log('You LEVELED UP! Level: ' + data.newLevel)
	})

	// Respawn
	socket.on('serverSendPlayerDeath', (data) => {
		console.log('You Died!')
		objects.players[socket.id].setData(data.posX, data.posY, data.vx, data.vy)
		socket.emit('verifyPlayerDeath', { id: socket.id })
		console.log(objects.players[socket.id])
		updateAtomList()
	})

	// Another player died
	socket.on('serverSendNotifyPlayerDeath', (data) => {
		// Append to chat TODO
	})

	// Update timer
	socket.on('time', (data) => {
		document.getElementById('timer').innerHTML = '<p>' + data.time + '</p>'
	})

	// Update scores
	socket.on('serverSendScoreUpdate', (data) => {
		updateScores(data.teamSlot, data.increment)
	})

	// A player has won
	socket.on('serverSendWinner', (data) => {
		setIngame(false) // Disable keyboard controls and rendering
		displayWinner(data)
	})

	// Sync team colors
	socket.on('serverSendTeamColors', (data) => {
		teamColors = data
		console.log(teamColors)
	})

	// Change texture when a tile has been captured
	socket.on('serverSendTileCapture', (data) => {
		objects.tiles['tile_' + data.tileX + '_' + data.tileY].texture = (spritesheet.textures[data.teamNumber + objects.tiles['tile_' + data.tileX + '_' + data.tileY].tile.texture])
		// console.log(objects.tiles['tile_' + data.tileY + '_' + data.tileX].texture)
	})

	// Tile health changed
	socket.on('serverSendTileHealth', (data) => {
		objects.tiles['tile_' + data.tileX + '_' + data.tileY].updateHealth(data.newHealth)
	})
}

/*
 ********************
 * Helper Functions *
 ********************
*/

// Helper function for serverSendObjectRemoval
function removeObject (data) {
	if (objects[data.type][data.id] !== undefined && objects[data.type][data.id] !== null) {
		objects[data.type][data.id].hide()
		objects[data.type][data.id].destroy()
		// delete objects[data.type][data.id];
		return true
	}
	else {
		return false
	}
}
