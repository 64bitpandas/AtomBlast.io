import { distanceBetween, isInBounds, GLOBAL } from '../../client/js/global'
import { deleteObject, getField, setField } from '../server'
import { collisionDetect } from './collision'
import { tickCompound } from './compound'

/**
 * Runs once a frame, per player.
 * @param {*} socket The socket.io instance
 * @param {string} room The name of the room
 * @param {*} thisPlayer The player object
 */
export function frameSync (socket, room, thisPlayer) {
	if (socket.connected) {
		let thisRoom = getField(['rooms', room])

		if (thisRoom !== undefined) {
			// Distance checking for all objects
			let tempObjects = {
				players: {},
				atoms: {},
				compounds: {}
			}

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
				let distance = distanceBetween(
					{ posX: thisRoom.atoms[atom].posX + GLOBAL.ATOM_RADIUS, posY: thisRoom.atoms[atom].posY - GLOBAL.ATOM_RADIUS },
					{ posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS })
				// Attractive force
				if (distance < GLOBAL.ATTRACTION_RADIUS) {
					let theta = Math.atan2((thisPlayer.posY - thisRoom.atoms[atom].posY), (thisPlayer.posX - thisRoom.atoms[atom].posX))

					// Attraction is based on logarithmic algorithm

					setField(1 / distance * Math.cos(theta) * GLOBAL.ATTRACTION_COEFFICIENT, ['rooms', room, 'atoms', atom, 'vx'])
					setField(1 / distance * Math.sin(theta) * GLOBAL.ATTRACTION_COEFFICIENT, ['rooms', room, 'atoms', atom, 'vy'])
					// thisRoom.atoms[atom].vx = 1 / distance * Math.cos(theta) * GLOBAL.ATTRACTION_COEFFICIENT;
					// thisRoom.atoms[atom].vy = 1 / distance * Math.sin(theta) * GLOBAL.ATTRACTION_COEFFICIENT;
					// console.log(this.vx, this.vy, this.posX, this.posY);
				}
				// Atom slowing down
				else if (Math.abs(thisRoom.atoms[atom].vx) > GLOBAL.DEADZONE || Math.abs(thisRoom.atoms[atom].vy) > GLOBAL.DEADZONE) {
					setField(thisRoom.atoms[atom].vx * GLOBAL.VELOCITY_STEP, ['rooms', room, 'atoms', atom, 'vx'])
					setField(thisRoom.atoms[atom].vy * GLOBAL.VELOCITY_STEP, ['rooms', room, 'atoms', atom, 'vy'])
					// thisRoom.atoms[atom].vx *= GLOBAL.VELOCITY_STEP;
					// thisRoom.atoms[atom].vy *= GLOBAL.VELOCITY_STEP;
				}

				if (Math.abs(thisRoom.atoms[atom].vx) <= GLOBAL.DEADZONE) { setField(0, ['rooms', room, 'atoms', atom, 'vx']) }
				if (Math.abs(thisRoom.atoms[atom].vy) <= GLOBAL.DEADZONE) { setField(0, ['rooms', room, 'atoms', atom, 'vy']) }

				// Move atom
				setField(thisRoom.atoms[atom].posX + thisRoom.atoms[atom].vx, ['rooms', room, 'atoms', atom, 'posX'])
				setField(thisRoom.atoms[atom].posY + thisRoom.atoms[atom].vy, ['rooms', room, 'atoms', atom, 'posY'])
				// thisRoom.atoms[atom].posX += thisRoom.atoms[atom].vx;
				// thisRoom.atoms[atom].posY += thisRoom.atoms[atom].vy;
			}

			// Populate tempObjects
			for (let objType in tempObjects) {
				for (let obj in thisRoom[objType]) {
					if (distanceBetween(thisRoom[objType][obj], thisPlayer) < GLOBAL.DRAW_RADIUS) { tempObjects[objType][obj] = thisRoom[objType][obj] }
					else if (objType === 'players') { // Player left view
						socket.emit('serverSendObjectRemoval', { id: obj, type: objType })
					}
				}
			}

			// Run collision detection script
			collisionDetect(socket, room, thisPlayer, tempObjects)

			socket.emit('objectSync', tempObjects)

			if (thisRoom.started) { socket.emit('time', { time: thisRoom.time.formattedTime }) }

			if (thisRoom !== undefined && !thisRoom.started) {
				// Send over the room player information
				// socket.to(room).broadcast.emit('roomInfo', thisRoom.players);
				socket.emit('roomInfo', thisRoom.players)
			}
		}
	}
}
