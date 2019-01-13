/**
 * Manages the atom list and atom usage for players.
 */
import { incrementField, getField, setField } from '../server'
import { generateID } from './serverutils'
import { GLOBAL } from '../../client/js/global'
import { TILES, TILE_NAMES, MAP_LAYOUT } from '../../client/js/obj/tiles'

export function incrementAtom (player, room, atomType, quantity) {
	// console.log(atomType);
	incrementField(quantity, ['rooms', room, 'players', player, 'atomList', atomType])
}

export function canCraft (player, room, blueprint) {
	// console.log(player);
	if (blueprint === undefined) {
		return false
	}
	for (let atom in blueprint.atoms) {
		let numAtoms = getField(['rooms', room, 'players', player.id, 'atomList', atom])
		if (numAtoms === undefined || numAtoms < blueprint.atoms[atom]) {
			return false
		}
	}

	return true
}

/**
 * Spawns an atom at the vent at the given row and column.
 * @param {number} row The row of the vent
 * @param {number} col The column of the vent to spawn at
 * @param {string} room The room to spawn in
 * @param {boolean} verbose True if this method should output to the console
 */
export function spawnAtomAtVent (row, col, room, verbose) {
	// Atom to spawn. Gets a random element from the tile paramter array `atomsToSpawn`
	let atomToSpawn = TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].params.atomsToSpawn[Math.floor(Math.random() * TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].params.atomsToSpawn.length)]

	let x = col * GLOBAL.GRID_SPACING * 2 + GLOBAL.GRID_SPACING
	let y = row * GLOBAL.GRID_SPACING * 2 - GLOBAL.GRID_SPACING

	spawnAtom(x, y, atomToSpawn, room, verbose)
}

/**
 *
 * @param {number} x X-position of center
 * @param {number} y Y-position of center
 * @param {string} type Type of atom to spawn
 * @param {string} room The room to spawn in
 * @param {boolean} verbose True if this method should output to the console
 */
export function spawnAtom (x, y, type, room, verbose) {
	let theta = Math.random() * Math.PI * 2 // Set random direction for atom to go in once spawned

	let atom = {
		typeID: type,
		id: generateID(),
		posX: x,
		posY: y,
		vx: Math.cos(theta) * GLOBAL.ATOM_SPAWN_SPEED,
		vy: Math.sin(theta) * GLOBAL.ATOM_SPAWN_SPEED
	}
	if (getField(['rooms', room]) !== undefined) {
		setField(atom, ['rooms', room, 'atoms', atom.id])
	}

	// Log to console
	if (verbose) {
		console.log('SPAWN ATOM ' + type + ' theta:' + theta + ', vx: ' + atom.vx + ', vy: ' + atom.vy)
	}
}
