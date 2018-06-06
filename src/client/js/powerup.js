export class Powerup {
    
    protected x, y, image, isEquipped;

    /**
     * 
     * @param {*} x X Coordinate of the Powerup 
     * @param {*} y Y Coordinate of the Powerup 
     * @param {*} type Type of the powerup
     */
    constructor (x, y) {
        this.x = x;
        this.y = y;
        isEquipped = false;
    }

    /**
     * 
     * @param {*} p5 
     */
    draw(p5) {
        if(this.isEquipped)
            return;
        p5.ellipse(x, y, GLOBAL.POWERUP_RADIUS, GLOBAL.POWERUP_RADIUS);
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
            player.
        }
    }

    use() {
        throw new Error('This Powerup must implement use()!');
    }

}

export class HealthPowerup extends Powerup {
    
    constructor(x,y) {
        super(x,y);
        image = ''; //TODO
    }

    use() {
        
    }
}
