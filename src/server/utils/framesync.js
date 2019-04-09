import { distanceBetween, isInBounds, GLOBAL } from '../../client/js/global'
import { deleteObject, getField, setField, incrementField } from '../server'
import { collisionDetect } from './collision'
import { tickCompound } from './compound'
import { Socket } from 'net'
import { smartEmit } from './serverutils'

/**
 * Runs once a frame, per ROOM. Refactored 4/8/19 from player to room.
 * @param {*} socket socket.io instance. INDEPENDENT OF PLAYER (any valid socket connection can go here!!!!!)
 * @param {string} room The name of the room
 */
export function frameSync(socket, room) {
	if (socket.connected) {
		// Increment frame count in the room
		incrementField(1, ['rooms', room, 'time', 'frames'])

		let thisRoom = getField(['rooms', room])

		if (thisRoom !== undefined) {
			// Move compounds
			for (let compound in thisRoom.compounds) {
				let compoundRef = thisRoom.compounds[compound]
				if (isInBounds(compoundRef)) {
					setField(compoundRef.posX + compoundRef.vx, ['rooms', room, 'compounds', compound, 'posX'])
					setField(compoundRef.posY + compoundRef.vy, ['rooms', room, 'compounds', compound, 'posY'])
					tickCompound(getField(['rooms', room, 'compounds', compound]), room, socket)
					// compoundRef.posX += compoundRef.vx;
					// compoundRef.posY += compoundRef.vy;
				}
				else { // delete
					deleteObject('compounds', compound, room, socket)
				}
			}
			// Move atoms
			for (let atom in thisRoom.atoms) {
				// Atom slowing down. This will be overridden by the player attraction if a player is close enough
				if (Math.abs(thisRoom.atoms[atom].vx) > GLOBAL.DEADZONE || Math.abs(thisRoom.atoms[atom].vy) > GLOBAL.DEADZONE) {
					setField(thisRoom.atoms[atom].vx * GLOBAL.VELOCITY_STEP, ['rooms', room, 'atoms', atom, 'vx'])
					setField(thisRoom.atoms[atom].vy * GLOBAL.VELOCITY_STEP, ['rooms', room, 'atoms', atom, 'vy'])
					// thisRoom.atoms[atom].vx *= GLOBAL.VELOCITY_STEP;
					// thisRoom.atoms[atom].vy *= GLOBAL.VELOCITY_STEP;
				}

				if (Math.abs(thisRoom.atoms[atom].vx) <= GLOBAL.DEADZONE) {
					setField(0, ['rooms', room, 'atoms', atom, 'vx'])
				}
				if (Math.abs(thisRoom.atoms[atom].vy) <= GLOBAL.DEADZONE) {
					setField(0, ['rooms', room, 'atoms', atom, 'vy'])
				}

				// Move atom
				setField(thisRoom.atoms[atom].posX + thisRoom.atoms[atom].vx, ['rooms', room, 'atoms', atom, 'posX'])
				setField(thisRoom.atoms[atom].posY + thisRoom.atoms[atom].vy, ['rooms', room, 'atoms', atom, 'posY'])
				// thisRoom.atoms[atom].posX += thisRoom.atoms[atom].vx;
				// thisRoom.atoms[atom].posY += thisRoom.atoms[atom].vy;
			}

			// Player specific actions
			for (let playerI in thisRoom.players) {
				// Distance checking for all objects
				let tempObjects = {
					players: {},
					atoms: {},
					compounds: {}
				}
				let thisPlayer = thisRoom.players[playerI]

				// Populate tempObjects
				for (let objType in tempObjects) {
					for (let obj in thisRoom[objType]) {
						if (distanceBetween(thisRoom[objType][obj], thisPlayer) < GLOBAL.DRAW_RADIUS) {
							tempObjects[objType][obj] = thisRoom[objType][obj]
						}
					}
				}

				// Check for atom attraction
				for (let atom in tempObjects.atoms) {
					let distance = distanceBetween(
						{ posX: thisRoom.atoms[atom].posX + GLOBAL.ATOM_RADIUS, posY: thisRoom.atoms[atom].posY - GLOBAL.ATOM_RADIUS },
						{ posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS })
					// Attractive force
					if (!thisPlayer.spectating && distance < GLOBAL.ATTRACTION_RADIUS && (thisRoom.atoms[atom].team === 'all' || thisPlayer.team === thisRoom.atoms[atom].team)) {
						let theta = Math.atan2((thisPlayer.posY - thisRoom.atoms[atom].posY), (thisPlayer.posX - thisRoom.atoms[atom].posX))

						// Attraction is based on logarithmic function
						setField(1 / distance * Math.cos(theta) * GLOBAL.ATTRACTION_COEFFICIENT, ['rooms', room, 'atoms', atom, 'vx'])
						setField(1 / distance * Math.sin(theta) * GLOBAL.ATTRACTION_COEFFICIENT, ['rooms', room, 'atoms', atom, 'vy'])
						// console.log(this.vx, this.vy, this.posX, this.posY);
					}
				}

				// Collision detection
				collisionDetect(socket, room, thisPlayer, tempObjects)

				smartEmit(socket, room, 'objectSync', tempObjects, thisPlayer.id)
			}

			if (thisRoom.started) {
				smartEmit(socket, room, 'time', { time: thisRoom.time.formattedTime })
			}

			if (thisRoom !== undefined && !thisRoom.started) {
				// Send over the room player information
				let roomInfo = {
					players: thisRoom.players,
					canStart: (thisRoom.type === '2v2' && Object.keys(thisRoom.players).length === 4) ||
						((thisRoom.type === '4v4' || thisRoom.type === '2v2v2v2') && Object.keys(thisRoom.players).length === 8) ||
						(thisRoom.type === '4v4v4v4' && Object.keys(thisRoom.players).length === 16) ||
						thisRoom.type === 'private'
				}
				smartEmit(socket, room, 'roomInfo', roomInfo)
			}
		}
	}
}
