import { generateID, GLOBAL } from '../../client/js/global'
import { getField, setField } from '../server'
import { getTeamColors } from './serverutils'
import { initRoom } from './serverinit'

/**
 * Matchmaking system for public matches. Runs after initial socket.io server connection, but before connecting to a server.
 * @param {*} socket socket.io instance. INDEPENDENT OF PLAYER (any valid socket connection can go here!!!!!)
 * @param {string} room Name of room
 * @param {string} team Name of team
 * @returns The new room that has been assigned
 */
export function roomMatchmaker (socket, room, team) {
	let validJoin = false // This join attempt was valid.
	let roomType = socket.handshake.query.roomType

	// Make sure the room you are trying to join is valid
	if (room !== GLOBAL.NO_ROOM_IDENTIFIER && getField(['rooms', room]) !== undefined && !getField(['rooms', room]).joinable && getField(['rooms', room]) !== undefined) { // Room full
		socket.emit('connectionError', { msg: 'The room ' + room + ' has started or is full!' })
	}

	if (team !== GLOBAL.NO_TEAM_IDENTIFIER && getField(['teams', team]) !== undefined && getField(['teams', team]).room !== undefined) {
		// Make sure everything is compatible
		if (getField(['rooms', getField(['teams', team]).room]) !== undefined && getField(['rooms', getField(['teams', team]).room]).type !== roomType) { // Wrong room type
			socket.emit('connectionError', { msg: 'Your team is playing in a ' + getField('rooms', getField(['teams', team]).room).type + ' room, but you are trying to join a ' + roomType + ' room!' })
		}
		else if (!getField(['teams', team, 'joinable'])) { // Team full
			console.log(getField(['teams']))
			socket.emit('connectionError', { msg: 'Your team is already in game or full!' })
		}
		else { // is joinable
			validJoin = true
			room = getField(['teams', team, 'room'])

			if (((roomType === '2v2v2v2' || roomType === '2v2') && getField(['teams', team, 'players']).length === 2) || getField(['teams', team, 'players']).length === 4) {
				setField(false, ['teams', team, 'joinable'])
			}
		}
	}
	// Team not found or need to join a random team
	else {
		// Try joining a room
		for (let roomName in getField(['rooms'])) {
			if (roomName.indexOf(roomType) > -1) {
				// Auto team
				if (team === GLOBAL.NO_TEAM_IDENTIFIER) {
					for (let i = 0; i < 4; i++) {
						if (getField(['rooms', roomName, 'teams', room + i]) && getField(['rooms', roomName, 'teams', room + i, 'joinable'])) {
							room = roomName
							team = room + i
						}
					}

					// No random teams are joinable- test if this room is full or not
					if (team === GLOBAL.NO_TEAM_IDENTIFIER) {
						if (((roomType === '4v4v4v4' || roomType === '2v2v2v2') && getField(['rooms', roomName, 'teams']).length < 4) || getField(['rooms', roomName, 'teams']).length < 2) {
							room = roomName
							team = room + '_' + (getField(['rooms', roomName, 'teams']).length)
						}
					}
				}
				// Custom team
				else if (((roomType === '4v4v4v4' || roomType === '2v2v2v2') && getField(['rooms', roomName, 'teams']).length < 4) || getField(['rooms', roomName, 'teams']).length < 2) {
					room = roomName
				}
			}
		}

		// No matching rooms - must create a new room
		if (room === GLOBAL.NO_ROOM_IDENTIFIER) {
			room = 'NA_' + roomType + '_' + generateID()
			if (team === GLOBAL.NO_TEAM_IDENTIFIER) {
				team = room + '_0'
			}
		}

		// Custom room auto team
		if (team === GLOBAL.NO_TEAM_IDENTIFIER) {
			for (let i = 0; i < 4; i++) {
				if (getField(['rooms', room]) && getField(['rooms', room, 'teams', room + '_' + i]) && getField(['rooms', room, 'teams', room + '_' + i, 'joinable'])) {
					team = room + i
				}
			}
		}
		// No random teams are joinable make a new team in custom room
		if (team === GLOBAL.NO_TEAM_IDENTIFIER) {
			try {
				team = room + '_' + (getField(['rooms', room, 'teams']).length)
			}
			catch (e) {
				team = room + '_0'
			}
		}

		// Make team
		setField({
			room: room,
			players: [],
			joinable: true
		}, ['teams', team])

		validJoin = true
	}

	// Join custom room
	if (validJoin) {
		// Set up room if it does not exist
		if (getField(['rooms', room]) === undefined || getField(['rooms', room]) === null) {
			initRoom(socket, room)
		}

		// Add player to team
		// Equivalent to rooms[room].teams.push({ name: team });
		getField(['teams', team, 'players']).push(socket.id)
		// Instantiate team in the room if it has not been done already
		if (getField(['teams', team, 'players']).length === 1) {
			// Equivalent to teams[socket.handshake.query.team].players.push(socket.id);
			getField(['rooms', room, 'teams']).push({ name: team, players: [socket.id] })
		}

		// console.log(getField(['rooms', room, 'teams']))
		socket.join(room, () => {
			console.log('[Server] '.bold.blue + `Player ${socket.handshake.query.name} (${socket.id}) joined room ${room} in team ${team}`.yellow)
		})
	}

	return { room: room, team: team }
}
