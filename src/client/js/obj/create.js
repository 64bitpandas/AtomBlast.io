/**
 * Responsible for all gameObject creation scripts for the client (atoms, compounds, players)
 */

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
    let texture = PIXI.loader.resources[GLOBAL.ATOM_SPRITES[GLOBAL.ATOM_IDS.indexOf(typeID)]].texture;

    if (typeID === '')
        throw new Error('The Atom object cannot be created without specifying behavior.');

    if (texture === undefined)
        throw new Error('Atom of type ' + typeID + ' could not be found!');

    let result = new GameObject(data.texture, data.id, data.posX, data.posY, data.vx, data.vy);
    result.typeID = data.typeID;
    result.height = GLOBAL.ATOM_RADIUS * 2;
    result.width = GLOBAL.ATOM_RADIUS * 2;

    return result;
}

export function createPlayer(data) {

}

export function createCompound(data) {

}