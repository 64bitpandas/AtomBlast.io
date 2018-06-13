import {GLOBAL} from './global.js';
import { GameObject } from './gameobject.js';
import { Player } from './player.js';
import * as PIXI from 'pixi.js';
import { distanceBetween } from './app.js';
import { screenCenterX, screenCenterY, player } from './pixigame.js';

export class Powerup extends GameObject {

    /**
     * Creates a Powerup at the given coordinates. If no coordinates are given, then 
     * the powerup spawns in a random location.
     * @param {PIXI.Texture} texture The texture of the powerup
     * @param {number} index The index of the powerup in the powerups array
     * @param {number} x (optional) X Coordinate of the Powerup 
     * @param {number} y (optional) Y Coordinate of the Powerup 
     */
    constructor (texture, index, x, y) {
        super(texture, index, x, y);
        this.height = GLOBAL.POWERUP_RADIUS * 2;
        this.width = GLOBAL.POWERUP_RADIUS * 2;
        this.isEquipped = false;
        this.typeID = -1;
    }

    /**
     * Run when players are nearby to check if they picked this powerup up.
     * @param {Player} player Player to check collision against
     * @returns true if collision detected, false otherwise
     */
    checkCollision(player) {
        if(this.isEquipped)
            return false; 
        if(distanceBetween(this, player) < GLOBAL.POWERUP_RADIUS+GLOBAL.PLAYER_RADIUS) {
            this.isEquipped = true;
            return true;
        }

        return false;
    }

    tick() {
        this.checkCollision(player);
        this.draw();
    }

    /**
     * MUST OVERRIDE! Consumes the powerup and applies effects
     */
    use() {
        throw new Error('This Powerup must implement use()!');
    }

}

export class HealthPowerup extends Powerup {
    
    constructor(index,x,y) {
        super(PIXI.loader.resources[GLOBAL.SPRITES[GLOBAL.P_HEALTH]].texture, index, x, y);
        this.typeID = GLOBAL.P_HEALTH;
    }

    use() {
        
    }
}

/**
 * Returns a new powerup object of the given type.
 * @param {number} typeID ID of the powerup to be created. ID's are as follows:
 * 0: HealthPowerup
 * To be Continued
 * @param {number} index The index of the powerup in the powerups array
 * @param {number} x (optional) x-coordinate of the powerup
 * @param {number} y (optional) y-coordinate of the powerup
 */
export function createPowerup(typeID, index, x, y) {
    switch(typeID) {
        case 0:
            return new HealthPowerup(index, x, y);
        // Tried to create a generic Powerup
        case -1:
            throw new Error('The Powerup object cannot be created without specifying behavior.');
    }
    
    throw new Error('Powerup of type ' + typeID + ' could not be found!');
}