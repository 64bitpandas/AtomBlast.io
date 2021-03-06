import { distanceBetween, GLOBAL, getCurrTile, getGlobalLocation } from '../../client/js/global'
import { deleteObject, getField, setField } from '../server'
import { damage, damageTile } from './ondamage'
import { incrementAtom } from './atoms'
import { TILE_NAMES, TILES } from '../../client/js/obj/tiles'
import { getTileID, smartEmit } from './serverutils'

/**
 * Runs once a frame, checks for collisions between objects and handles them accordingly.
 * Run using
 * @param {*} socket socket.io instance. INDEPENDENT OF PLAYER (any valid socket connection can go here!!!!!)
 * @param {string} room The name of the room
 * @param {*} thisPlayer The player object
 * @param {*} tempObjects The list of objects to tick. Should only be the objects rendered on the screen of thisPlayer. Contains compounds, atoms, players
 */
export function collisionDetect (socket, room, thisPlayer, tempObjects) {
	// Make sure the player is currently ingame
	if (!thisPlayer.dead && !thisPlayer.spectating) {
		// Check for collected atoms
		for (let atom in tempObjects.atoms) {
			if (tempObjects.atoms[atom].team === thisPlayer.team || tempObjects.atoms[atom].team === 'all') {
				let distance = distanceBetween(
					{ posX: tempObjects.atoms[atom].posX + GLOBAL.ATOM_RADIUS, posY: tempObjects.atoms[atom].posY - GLOBAL.ATOM_RADIUS },
					{ posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS })

				if (distance < GLOBAL.ATOM_COLLECT_THRESHOLD) {
					// console.log(atom);
					incrementAtom(thisPlayer.id, room, tempObjects.atoms[atom].typeID, 1)

					deleteObject('atoms', atom, room, socket)
				}
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
				if (cmp.blueprint.type !== 'block' && distance < cmp.blueprint.params.size + GLOBAL.PLAYER_RADIUS) {
					let dmg = cmp.blueprint.params.damage

					// Deal splash damage if it is a toxic compound or on fire
					if (cmp.blueprint.type === 'toxic' || cmp.ignited) {
						dmg = cmp.blueprint.params.splashDamage
					}

					damage({
						damage: dmg,
						player: thisPlayer.id,
						sentBy: cmp.sender,
						id: compound
					}, room, socket)

					if (cmp.blueprint.type !== 'toxic' && !cmp.ignited) {
						deleteObject('compounds', compound, room, socket)
					}
				}

				// Barrier block collisions
				if (cmp.blueprint.type === 'block') {
					for (let otherCompound in tempObjects.compounds) {
						let othercmp = tempObjects.compounds[otherCompound]

						if (cmp.sendingTeam !== othercmp.sendingTeam && othercmp.blueprint.type !== 'block') {
							let distance = distanceBetween(
								{ posX: cmp.posX + cmp.blueprint.params.size / 2, posY: cmp.posY - cmp.blueprint.params.size / 2 },
								{ posX: othercmp.posX + othercmp.blueprint.params.size / 2, posY: othercmp.posY - othercmp.blueprint.params.size / 2 }
							)

							if (distance < cmp.blueprint.params.size + othercmp.blueprint.params.size) {
								// Damage indcator
								smartEmit(socket, room, 'serverSendDamageIndicator', {
									damage: (cmp.ignited) ? cmp.blueprint.params.splashDamage : cmp.blueprint.params.damage,
									posX: cmp.posX,
									posY: cmp.posY
								})

								// Delete both compounds. TODO deal damage to higher level barrier blocks
								deleteObject('compounds', compound, room, socket)
								deleteObject('compounds', otherCompound, room, socket)
							}
						}
					}
				}
			}
			else { // check for tile collisions
				let tileID = getTileID(getGlobalLocation(cmp), room)
				if (tileID) {
					if (distanceBetween(cmp, {
						posX: getGlobalLocation(cmp).globalX * GLOBAL.GRID_SPACING * 2 + GLOBAL.GRID_SPACING,
						posY: getGlobalLocation(cmp).globalY * GLOBAL.GRID_SPACING * 2 - GLOBAL.GRID_SPACING
					}) < GLOBAL.STRONGHOLD_RADIUS && cmp.blueprint.type !== 'block' && cmp.sendingTeam !== getField(['rooms', room, 'tiles', tileID, 'owner'])) {
						// Damage indcator
						smartEmit(socket, room, 'serverSendDamageIndicator', {
							damage: (cmp.ignited) ? cmp.blueprint.params.splashDamage : cmp.blueprint.params.damage,
							posX: cmp.posX,
							posY: cmp.posY
						})
						deleteObject('compounds', compound, room, socket)
						damageTile(tileID, (cmp.ignited) ? cmp.blueprint.params.splashDamage : cmp.blueprint.params.damage, thisPlayer.id, room, socket)
					}
				}
			}
		}

		// Check for stronghold buff
		let currTile = getTileID(getGlobalLocation(thisPlayer), room)
		if (currTile && getField(['rooms', room, 'tiles', currTile, 'type']) === 'stronghold' && getField(['rooms', room, 'tiles', currTile, 'owner']) !== 'all') {
			thisPlayer.stronghold = (getField(['rooms', room, 'tiles', currTile, 'owner']) === thisPlayer.team) ? 'team' : 'notteam'
		}
		else {
			thisPlayer.stronghold = 'none'
		}
	}
}
