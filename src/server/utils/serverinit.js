import { getField, setField } from '../server'
import { MAP_LAYOUT, TILES, TILE_NAMES } from '../../client/js/obj/tiles'
import { GLOBAL } from '../../client/js/global'
import { spawnAtomAtVent } from './atoms'
import colors from 'colors' // Console colors :D
import { generateID } from './serverutils'

/**
 * Methods to run on server initialization and player connect initialization.
 */

/**
 * Global initialiation. Run once on server start.
 */
export function initGlobal () {
	// Set up atom spawning three times a second. This is processed outside of the player specific behavior because more players joining !== more resources spawn.
	setInterval(() => {
		for (let room in getField(['rooms'])) {
			if (getField(['rooms', room, 'started'])) {
				for (let row = 0; row < MAP_LAYOUT.length; row++) {
					for (let col = 0; col < MAP_LAYOUT[0].length; col++) {
						if (TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].type === 'spawner') {
							spawnAtomAtVent(row, col, room, false)
						}
					}
				}
			}
		}
	}, GLOBAL.ATOM_SPAWN_DELAY)

	// Timer
	setInterval(() => {
		for (let room in getField(['rooms'])) {
			if (getField(['rooms', room, 'started'])) {
				let seconds = getField(['rooms', room, 'time', 'seconds'])

				let minutes = getField(['rooms', room, 'time', 'minutes'])

				// Equivalent to rooms[room].time.seconds++;
				setField(seconds + 1, ['rooms', room, 'time', 'seconds'])

				if (seconds >= 60) {
					setField(0, ['rooms', room, 'time', 'seconds'])
					setField(minutes + 1, ['rooms', room, 'time', 'minutes'])
				}

				// Set formatted Time
				setField(minutes + ':' + ((seconds < 10) ? '0' : '') + seconds, ['rooms', room, 'time', 'formattedTime'])
			}
		}
	}, 1000)
}

/**
 * Run on every player join.
 * @param {*} socket The socket.io instance
 * @param {string} room The name of the room that the player belongs to
 * @param {string} team The name of the team that the player belongs to
 */
export function initPlayer (socket, room, team) {
	// Initialize room array and spawn atoms on first player join
	let thisRoom = getField(['rooms', room])

	// Set up room if it does not exist
	if (thisRoom === undefined || thisRoom === null) {
		console.log('[Server] '.bold.blue + 'Setting up room '.yellow + ('' + room).bold.red + ' as type ' + socket.handshake.query.roomType)
		setField({
			joinable: true,
			teams: [],
			atoms: {},
			compounds: {},
			type: socket.handshake.query.roomType,
			time: {
				minutes: 0,
				seconds: 0,
				formattedTime: '0:00'
			}
		}, ['rooms', room])

		// Set up capturable tiles
		setField({}, ['rooms', room, 'tiles'])
		// TODO support multiple map layouts
		for (let row = 0; row < MAP_LAYOUT.length; row++) {
			for (let col = 0; col < MAP_LAYOUT[row].length; col++) {
				let currTile = TILES[TILE_NAMES[MAP_LAYOUT[row][col]]]
				if (currTile.type === 'spawner' || currTile.type === 'stronghold' || currTile.type === 'nucleus') {
					let tileID = generateID()
					setField({
						id: tileID,
						type: currTile.type,
						globalX: col,
						globalY: row,
						captured: false,
						owner: 'none',
						health: GLOBAL[('MAX_' + currTile.type + '_HEALTH').toUpperCase()]
					}, ['rooms', room, 'tiles', tileID])
				}
			}
		}
	}
	thisRoom = getField(['rooms', room])

	// Add team to database

	// Equivalent to rooms[room].teams.push({ name: team });
	if (getField(['teams', team, 'players']).length === 1) {
		setField({ name: team }, ['rooms', room, 'teams', getField(['rooms', room, 'teams']).length])
	}

	// Check if room is full
	if (((thisRoom.type === '4v4' || thisRoom.type === '2v2') && thisRoom.teams.length === 2) || thisRoom.teams.length === 4) {
		setField(false, ['rooms', room, 'joinable'])
	}

	// Create new player in rooms object
	setField({
		id: socket.id,
		name: socket.handshake.query.name,
		room: socket.handshake.query.room,
		team: team,
		health: GLOBAL.MAX_HEALTH,
		posX: GLOBAL.SPAWN_POINTS[thisRoom.teams.length - 1].x * GLOBAL.GRID_SPACING * 2,
		posY: GLOBAL.SPAWN_POINTS[thisRoom.teams.length - 1].y * GLOBAL.GRID_SPACING * 2,
		vx: 0,
		vy: 0,
		experience: 0,
		damagedBy: {}
	}, ['rooms', room, 'players', socket.id])
}
