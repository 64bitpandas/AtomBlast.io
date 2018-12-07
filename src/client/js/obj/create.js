/**
 * Responsible for all gameObject creation scripts for the client (atoms, compounds, players)
 */
import * as PIXI from 'pixi.js';
import { Player } from './player.js';
import { GLOBAL } from '../global.js';
import { GameObject } from './gameobject.js';
import { distanceBetween } from '../global.js';
import { screenCenterX, screenCenterY, player } from '../pixigame.js';
import { socket } from '../socket.js';
import { updateAtomList } from '../app.js';

/**
 * Spawns an atom.
 * @param {*} data The server object reference to spawn on the clientside. Must contain:
 *  - typeID {string} See GLOBAL.ATOM_IDS
 *  - id {number} Unique ID
 *  - posX {number}
 *  - posY {number}
 *  - vx {number}
 *  - vy {number}
 */
export function createAtom(data) {

    let texture = PIXI.loader.resources[GLOBAL.ATOM_SPRITES[GLOBAL.ATOM_IDS.indexOf(data.typeID)]].texture;

    if (data.typeID === '')
        throw new Error('The Atom object cannot be created without specifying behavior.');

    if (texture === undefined)
        throw new Error('Atom of type ' + data.typeID + ' could not be found!');

    let result = new GameObject(texture, data.id, data.posX, data.posY, data.vx, data.vy);
    result.typeID = data.typeID;
    result.height = GLOBAL.ATOM_RADIUS * 2;
    result.width = GLOBAL.ATOM_RADIUS * 2;

    return result;
}

export function createPlayer(data) {

}

export function createCompound(data) {

}