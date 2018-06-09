import {GLOBAL} from './global.js';

export class Powerup {

    /**
     * Creates a Powerup at the given coordinates. If no coordinates are given, then 
     * the powerup spawns in a random location.
     * @param {number} index The index of the powerup in the powerups array
     * @param {number} x (optional) X Coordinate of the Powerup 
     * @param {number} y (optional) Y Coordinate of the Powerup 
     */
    constructor (index, x, y) {
        if(x !== undefined && y !== undefined) {
            this.x = x;
            this.y = y;
        }
        else {
            this.x = Math.random() * GLOBAL.MAP_SIZE * 2 - GLOBAL.MAP_SIZE;
            this.y = Math.random() * GLOBAL.MAP_SIZE * 2 - GLOBAL.MAP_SIZE;
        }
        
        this.isEquipped = false;
        this.typeID = -1;
    }

    /**
     * Draws the powerup either near the player or on the map. Call once per frame.
     * @param {*} p5 P5 reference to use
     * @param {*} player (optional) The player reference to use - needed only if powerup is equipped
     */
    draw(p5, player) {
        if(this.isEquipped)
            return; //TODO draw around player
        // TODO fill with image
        p5.ellipse(this.x, this.y, GLOBAL.POWERUP_RADIUS, GLOBAL.POWERUP_RADIUS);
    }
    
    /**
     * Run when players are nearby to check if they picked this powerup up.
     * @param {*} player Player to check collision against
     * @returns true if collision detected, false otherwise
     */
    checkCollision(player) {
        if(this.isEquipped)
            return false; 
        if(Math.pow((this.y - player.y), 2) + Math.pow((this.x - player.x), 2) < Math.pow(GLOBAL.POWERUP_RADIUS+GLOBAL.PLAYER_RADIUS, 2)) {
            this.isEquipped = true;
            return true;
        }

        return false;
    }

    use() {
        throw new Error('This Powerup must implement use()!');
    }

}

export class HealthPowerup extends Powerup {
    
    constructor(index,x,y) {
        super(index,x,y);
        this.image = ''; //TODO
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