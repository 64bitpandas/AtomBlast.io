import { distanceBetween, GLOBAL, getCurrTile, getGlobalLocation } from '../../client/js/global'
import { deleteObject } from '../server'
import { damage, damageTile } from './ondamage'
import { incrementAtom } from './atoms'
import { TILE_NAMES, TILES } from '../../client/js/obj/tiles'
import { getTileID } from './serverutils'

/**
 * Runs once a frame, checks for collisions between objects and handles them accordingly.
 * Run using
 * @param {*} socket The socket.io instance
 * @param {string} room The name of the room
 * @param {*} thisPlayer The player object
 * @param {*} tempObjects The list of objects to tick. Should only be the objects rendered on the screen of thisPlayer. Contains compounds, atoms, players
 */
export function collisionDetect (socket, room, thisPlayer, tempObjects) {
	// Check for collected atoms
	for (let atom in tempObjects.atoms) {
		let distance = distanceBetween(
			{ posX: tempObjects.atoms[atom].posX + GLOBAL.ATOM_RADIUS, posY: tempObjects.atoms[atom].posY - GLOBAL.ATOM_RADIUS },
			{ posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS })

		if (distance < GLOBAL.ATOM_COLLECT_THRESHOLD) {
			// console.log(atom);
			incrementAtom(thisPlayer.id, room, tempObjects.atoms[atom].typeID, 1)
			socket.to(room).broadcast.emit('serverSendObjectRemoval', { id: atom, type: 'atoms' })

			deleteObject('atoms', atom, room, socket)
		}
	}

	// Check for compound collisions
	for (let compound in tempObjects.compounds) {
		let cmp = tempObjects.compounds[compound]

		if (cmp.sendingTeam !== thisPlayer.team) {
			let distance = distanceBetween(
				{ posX: cmp.posX + cmp.blueprint.params.size / 2, posY: cmp.posY - cmp.blueprint.params.size / 2 },
				{ posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS })

			// Hit player
			if (distance < cmp.blueprint.params.size + GLOBAL.PLAYER_RADIUS) {
				let dmg = cmp.blueprint.params.damage

				// Deal splash damage if it is a toxic compound or on fire
				if (cmp.blueprint.type === 'toxic' || cmp.ignited) {
					dmg = cmp.blueprint.params.splashDamage
				}

				damage({
					damage: dmg,
					player: socket.id,
					sentBy: cmp.sender,
					id: compound
				}, room, socket)

				if (cmp.blueprint.type !== 'toxic' && !cmp.ignited) {
					deleteObject('compounds', compound, room, socket)
				}
			}
		}
		else { // check for tile collisions
			let tileID = getTileID(getGlobalLocation(cmp), room)
			if (tileID) {
				if(distanceBetween(cmp, {
					posX: getGlobalLocation(cmp).globalX * GLOBAL.GRID_SPACING * 2 + GLOBAL.GRID_SPACING,
					posY: getGlobalLocation(cmp).globalY * GLOBAL.GRID_SPACING * 2 - GLOBAL.GRID_SPACING,
				}) < GLOBAL.STRONGHOLD_RADIUS) {
					deleteObject('compounds', compound, room, socket)
					damageTile(tileID, cmp.blueprint.params.damage, socket.id, room, socket)
				}
			}
		}
	}
}
