import { TILES, TILE_NAMES, MAP_LAYOUT } from '../../client/js/obj/tiles';
import { getField, setField } from '../server';
import { GLOBAL } from '../../client/js/global';

/**
 * Misc. standalone utilities for the server.
 */

/**
* Returns a random number between between 10000000 and 99999999, inclusive.
* TODO Make every ID guaranteed unique
* @returns random id between 10000000 and 99999999
*/
export function generateID() {
    return Math.floor(Math.random() * 90000000) + 10000000;
}

/**
 * Spawns an atom at the vent at the given row and column.
 * @param {number} row The row of the vent 
 * @param {number} col The column of the vent to spawn at
 * @param {string} room The room to spawn in
 * @param {boolean} verbose True if this method should output to the console
 */
export function spawnAtomAtVent(row, col, room, verbose) {
    // Atom to spawn. Gets a random element from the tile paramter array `atomsToSpawn`
    let atomToSpawn = TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].params.atomsToSpawn[Math.floor(Math.random() * TILES[TILE_NAMES[MAP_LAYOUT[row][col]]].params.atomsToSpawn.length)];

    let x = col * GLOBAL.GRID_SPACING * 2 + GLOBAL.GRID_SPACING;
    let y = row * GLOBAL.GRID_SPACING * 2 - GLOBAL.GRID_SPACING;

    spawnAtom(x, y, atomToSpawn, room, verbose);

}

/**
 * 
 * @param {number} x X-position of center
 * @param {number} y Y-position of center
 * @param {string} type Type of atom to spawn
 * @param {string} room The room to spawn in
 * @param {boolean} verbose True if this method should output to the console
 */
export function spawnAtom(x, y, type, room, verbose) {

    let theta = Math.random() * Math.PI * 2; // Set random direction for atom to go in once spawned

    let atom = {
        typeID: type,
        id: generateID(),
        posX: x,
        posY: y,
        vx: Math.cos(theta) * GLOBAL.ATOM_SPAWN_SPEED,
        vy: Math.sin(theta) * GLOBAL.ATOM_SPAWN_SPEED
    };
    if (getField(['rooms', room]) !== undefined)
        setField(atom, ['rooms', room, 'atoms', atom.id]);

    // Log to console
    if (verbose)
        console.log('SPAWN ATOM ' + atomToSpawn + ' theta:' + theta + ', vx: ' + atom.vx + ', vy: ' + atom.vy);
}

/**
 * Returns the index of the given team within the team array of the given room.
 * @param {string} room The room name to check
 * @param {string} teamName The team name to return the number of
 */
export function getTeamNumber(room, teamName) {
    for (let i = 0; i < getField(['rooms', room, 'teams']).length; i++)
        if (getField(['rooms', room, 'teams'])[i].name === teamName)
            return i;

    return -1; //Team not found
}