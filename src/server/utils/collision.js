import { distanceBetween, GLOBAL } from '../../client/js/global';

/**
 * Runs once a frame, checks for collisions between objects and handles them accordingly.
 * Run using 
 * @param {*} socket The socket.io instance
 * @param {string} room The name of the room
 * @param {*} thisPlayer The player object
 * @param {*} tempObjects The list of objects to tick. Should only be the objects rendered on the screen of thisPlayer.
 */
export function collisionDetect(socket, room, thisPlayer, tempObjects) {
    
    // Check for collected atoms
    for(let atom in tempObjects.atoms) {
        let distance = distanceBetween(
            { posX: tempObjects.atoms[atom].posX + GLOBAL.ATOM_RADIUS, posY: tempObjects.atoms[atom].posY - GLOBAL.ATOM_RADIUS },
            { posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS, posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS });
        
        if(distance < GLOBAL.ATOM_COLLECT_THRESHOLD)
            socket.emit('atomCollected', {
                id: atom,
                typeID: tempObjects.atoms[atom].typeID
            });
    }

}