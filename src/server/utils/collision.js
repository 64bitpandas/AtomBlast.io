import { distanceBetween, GLOBAL } from '../../client/js/global';
import { setField, deleteObject } from '../server';
import { damage } from './ondamage';
import { incrementAtom } from './atoms';

/**
 * Runs once a frame, checks for collisions between objects and handles them accordingly.
 * Run using 
 * @param {*} socket The socket.io instance
 * @param {string} room The name of the room
 * @param {*} thisPlayer The player object
 * @param {*} tempObjects The list of objects to tick. Should only be the objects rendered on the screen of thisPlayer. Contains compounds, atoms, players
 */
export function collisionDetect(socket, room, thisPlayer, tempObjects) {

	// Check for collected atoms
	for (let atom in tempObjects.atoms) {
		let distance = distanceBetween(
			{ posX: tempObjects.atoms[atom].posX + GLOBAL.ATOM_RADIUS, posY: tempObjects.atoms[atom].posY - GLOBAL.ATOM_RADIUS },
			{ posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS });

		if (distance < GLOBAL.ATOM_COLLECT_THRESHOLD) {

			// console.log(atom);
			incrementAtom(thisPlayer.id, room, tempObjects.atoms[atom].typeID, 1);
			socket.to(room).broadcast.emit('serverSendObjectRemoval', { id: atom, type: 'atoms' });
			socket.emit('serverSendObjectRemoval', { id: atom, type: 'atoms' });
			deleteObject('atoms', atom, room, socket);

		}
	}

	// Check for compound collisions
	for (let compound in tempObjects.compounds) {

		let cmp = tempObjects.compounds[compound];

		if (cmp.sendingTeam !== thisPlayer.team) {
			let distance = distanceBetween(
				{ posX: cmp.posX + cmp.blueprint.params.size / 2, posY: cmp.posY - cmp.blueprint.params.size / 2 },
				{ posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS });

			// Hit player
			if (distance < cmp.blueprint.params.size + GLOBAL.PLAYER_RADIUS) {
				damage({
					damage: (cmp.ignited) ? cmp.blueprints.params.ignitedDamage : cmp.blueprint.params.damage,
					player: socket.id,
					sentBy: cmp.sender,
					id: compound
				}, room, socket);

				deleteObject('compounds', compound, room, socket);
			}
		}
	}
}