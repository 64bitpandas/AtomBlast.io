import {GLOBAL} from './global.js';

export class Powerup {

    /**
     * 
     * @param {*} x X Coordinate of the Powerup 
     * @param {*} y Y Coordinate of the Powerup 
     */
    constructor (x, y) {
        if(x !== undefined && y !== undefined) {
            this.x = x;
            this.y = y;
        }
        else {
            this.x = Math.random() * GLOBAL.MAP_SIZE;
            this.y = Math.random() * GLOBAL.MAP_SIZE;
        }
        
        this.isEquipped = false;
    }

    /**
     * 
     * @param {*} p5 
     */
    draw(p5) {
        if(this.isEquipped)
            return;
        // TODO fill with image
        p5.ellipse(this.x, this.y, GLOBAL.POWERUP_RADIUS, GLOBAL.POWERUP_RADIUS);
    }
    
    /**
     * 
     * @param {*} player Player to check collision against
     */
    checkCollision(player) {
        if(isEquipped)
            return; 
        if(Math.pow((this.y - player.y), 2) + Math.pow((this.x - player.x), 2) < Math.pow(r+GLOBAL.PLAYER_RADIUS, 2)) {
            isEquipped = true;
            // player.
        }
    }

    use() {
        throw new Error('This Powerup must implement use()!');
    }

}

export class HealthPowerup extends Powerup {
    
    constructor(x,y) {
        super(x,y);
        this.image = ''; //TODO
    }

    use() {
        
    }
}
