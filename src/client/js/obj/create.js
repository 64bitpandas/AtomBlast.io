/**
 * Responsible for all gameObject creation and creation request scripts
 * for the client (atoms, compounds, players)
 */
import * as PIXI from 'pixi.js'
import { Player } from './player.js'
import { GLOBAL } from '../global.js'
import { GameObject } from './gameobject.js'
import { distanceBetween } from '../global.js'
import { screenCenterX, screenCenterY, player } from '../pixigame.js'
import { socket } from '../socket.js'
import { updateAtomList, updateCompoundButtons } from '../app.js'

/**
 * Renders a new atom.
 * @param {*} data The server object reference to spawn on the clientside. Must contain:
 *  - typeID {string} See GLOBAL.ATOM_IDS
 *  - id {number} Unique ID
 *  - posX {number}
 *  - posY {number}
 *  - vx {number}
 *  - vy {number}
 */
export function createRenderAtom (data) {
	let texture = PIXI.loader.resources[GLOBAL.ATOM_SPRITES[GLOBAL.ATOM_IDS.indexOf(data.typeID)]].texture

	if (data.typeID === '') { throw new Error('The Atom object cannot be created without specifying behavior.') }

	if (texture === undefined) { throw new Error('Atom of type ' + data.typeID + ' could not be found!') }

	let result = new GameObject(texture, data.id, data.posX, data.posY, data.vx, data.vy)
	result.typeID = data.typeID
	result.height = GLOBAL.ATOM_RADIUS * 2
	result.width = GLOBAL.ATOM_RADIUS * 2

	return result
}

export function createPlayer (data) {

}

/**
 * Recreates an already spawned compound on the clientside based on server data.
 * @param {*} data Data sent from server:
 *  - id {number} Unique ID
 *  - posX {number}
 *  - posY {number}
 *  - vx {number}
 *  - vy {number}
 *  - blueprint {*}
 *  - sendingTeam {string}
 *  - sender {number - socket ID}
 */
export function createRenderCompound (data) {
	let texture = PIXI.loader.resources[data.blueprint.texture].texture
	let result = new GameObject(texture, data.id, data.posX, data.posY, data.vx, data.vy)
	result.blueprint = data.blueprint
	result.sendingTeam = data.sendingTeam
	result.sender = data.sender

	// Parse params
	for (let param in data.blueprint.params) {
		result[param] = data.blueprint.params[param]
	}

	// Use params
	result.width = result.size
	result.height = result.size

	return result
}

/**
 * Creates a Compound by sending a request to the server.
 * @param {*} blueprint Then blueprint to create the compound from
 * @param {number} xIn x-coords
 * @param {number} yIn y-coords
 * @param {number} streamID The current stream number.
 * @returns true if successful, false if the compound was not requested.
 */
export function requestCreateCompound (blueprint, xIn, yIn, streamID) {
	updateCompoundButtons()

	// if (blueprint.type === 'speed') {
	//     // this.hide();
	//     player.speedMult += blueprint.params.speedFactor * (1 / player.speedMult);
	//     console.log('New speed is ' + player.speedMult);
	// } else if (blueprint.type === 'health') {
	//     socket.emit('damage', {
	//         damage: -blueprint.params.healthModifier,
	//         sender: socket.id
	//     });
	//     if (player.health > GLOBAL.MAX_HEALTH) {
	//         player.health = GLOBAL.MAX_HEALTH;
	//     }
	// } else {
	// let cursor = app.renderer.plugins.interaction.mouse.global;

	let centerX = window.innerWidth / 2
	let centerY = window.innerHeight / 2
	// console.log(centerX - cursor.x, cursor.y - centerY)
	socket.emit('requestCreateCompound', {
		blueprint: blueprint,
		sendingTeam: player.team,
		sender: socket.id,
		mousePos: {
			x: xIn - centerX,
			y: centerY - yIn
		},
		streamID: streamID
	})

	// Emits the crafting event to update experience TODO
	// socket.emit('experienceEvent', {
	//     event: 'CRAFT'
	// });
}
