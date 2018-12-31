/**
 * Manages compound creation and behavior.
 * Moved from clientside compound.js
 */
import { GLOBAL } from '../../client/js/global';
import { canCraft } from './atoms';
import { generateID } from './serverutils';
import { incrementField, setField } from '../server';
import { damage } from './ondamage';

/**
  * Checks if a compound can be created, deducts craft material, and returns the new compound.
  * Does NOT add the new compound to the objects array.
  * @param data - Data sent from the client.
  *  - blueprint: The blueprint of the compound to create
  *  - sendingTeam: Team of the player who sent this
  *  - mousePos: Mouse position of the player who sent this. Contains x and y components
  *  - sender: Player who sent this
  * @param room - The name of the room
  */
export function createCompound(data, room, thisPlayer) {


    if (!canCraft(thisPlayer, room, data.blueprint))
        return false;

    // Calculate velocities based on cursor position
    let theta = Math.atan2(data.mousePos.y, data.mousePos.x);
    let newCompound = {
        id: generateID(),
        posX: thisPlayer.posX + GLOBAL.PLAYER_RADIUS,
        posY: thisPlayer.posY - GLOBAL.PLAYER_RADIUS,
        vx: thisPlayer.vx + data.blueprint.params.speed * Math.cos(theta),
        vy: thisPlayer.vy + data.blueprint.params.speed * Math.sin(theta),
        blueprint: data.blueprint,
        sendingTeam: data.sendingTeam,
        sender: data.sender
    };
    // console.log("This player: ");
    // console.log(thisPlayer);
    // Add functionality for specific blueprint types
    if (data.blueprint.type === 'speed') {
        incrementField(data.blueprint.params.speedFactor * (1 / thisPlayer.speedMult), ['rooms', room, 'players', thisPlayer.id, 'speedMult']);
        damage({
            damage: -blueprint.params.healthModifier,
            sender: socket.id
        }, room, socket);
        if (thisPlayer.health > GLOBAL.MAX_HEALTH) {
            setField(GLOBAL.MAX_HEALTH, ['rooms', room, 'players', thisPlayer.id, 'health']);
        }
    } 

    //Emits the crafting event to update experience TODO
    // socket.emit('experienceEvent', {
    //     event: 'CRAFT'
    // });


    // Remove atoms from inventory
    if(!data.streamNumber || data.streamNumber === 1) {
        for (let atom in data.blueprint.atoms) {
            incrementField(-data.blueprint.atoms[atom], ['rooms', room, 'players', thisPlayer.id, 'atomList', atom]);
        }
    }

    return newCompound;
}


/**
 * Checks compound behavior based on compound type. Runs once a frame.
 * @param {number} compound ID of compound
 * @param {string} room Name of room
 */
export function tickCompound(compound, room) {
    //TODO
    // switch (compound.blueprint.type) {
    //     case 'flammable':
    //         let tileCol = Math.floor(this.posX / (GLOBAL.GRID_SPACING * 2));
    //         let tileRow = Math.floor(this.posY / (GLOBAL.GRID_SPACING * 2));
    //         if (MAP_LAYOUT[MAP_LAYOUT.length - tileRow - 2] !== undefined && MAP_LAYOUT[MAP_LAYOUT.length - tileRow - 2][tileCol] === 'F' && !this.ignited) {
    //             console.log('IGNITE');
    //             this.ignited = true;
    //             this.texture = PIXI.loader.resources[GLOBAL.IGNITE_SPRITE].texture;
    //         }
    //         break;  
    // }
}