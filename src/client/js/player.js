import {GLOBAL} from './global.js';

export class Player {

    /**
     * Constructor for creating a new Player in the server side
     * @param {*} id 
     * @param {*} name 
     * @param {*} room 
     */
    constructor(id, name, room, x, y, theta, speed, powerups) {
        this.id = id;
        this.name = name;
        this.room = room;

        // Create new player
        if(arguments.length === 3) {
            this.x = 500; //Math.random() * 1000;
            this.y = 500; //Math.random() * 1000;
            this.theta = 0;
            this.speed = GLOBAL.playerSpeed;
            this.powerups = [];
        }

        // Constructor for reconstructing a player on the Client side
        else {
            this.x = x;
            this.y = y;
            this.theta = theta;
            this.speed = speed;
            this.powerups = [];
        }
        
    }
    
      /** 
   * Draws all components of a given player, including all powerups and atoms held.
   * @param {any} player Player object containing all playerdata. See `server.js` for a detailed list of required fields
   * @param {boolean} isThisPlayer True if the player to be drawn is owned by this client.
   */
    draw(isThisPlayer, p5) {

        // Predict positions of other player
        if (!isThisPlayer) {
            this.x += Math.cos(this.theta) * this.speed;
            this.y += Math.sin(this.theta) * this.speed;
        }
            // Draw player
            p5.ellipse(this.x, this.y, 2*GLOBAL.PLAYER_RADIUS);
        // }
        // else {
            // p5.translate(-this.x, -this.y);
            // p5.ellipse(window.innerWidth / 2, window.innerHeight / 2, 2 * GLOBAL.PLAYER_RADIUS);
        // }


        // p5.translate(this.x, this.y);
        p5.text(this.name, this.x, this.y);

        // Debug lines
        p5.text("x: " + Math.round(this.x), this.x, this.y -30);
        p5.text("y: " + Math.round(this.y), this.x, this.y -15);
        p5.text("ID: " + this.id.substring(0, 6), this.x, this.y + 15);
    }

    move(p5) {

        // X and Y components of theta, value equal to -1 or 1 depending on direction
        let xDir = 0, yDir = 0;
        // W (up)
        if (p5.keyIsDown(GLOBAL.KEY_W)) {
            this.speed = GLOBAL.MAX_SPEED;
            yDir = 1;
        }
        // A (left)
        if (p5.keyIsDown(GLOBAL.KEY_A)) {
            this.speed = GLOBAL.MAX_SPEED;
            xDir = -1;
        }
        // S (down)
        if (p5.keyIsDown(GLOBAL.KEY_S)) {
            yDir = -1;
            this.speed = GLOBAL.MAX_SPEED;
        }
        // D (right)
        if (p5.keyIsDown(GLOBAL.KEY_D)) {
            xDir = 1;
            this.speed = GLOBAL.MAX_SPEED;
        }
        // Set direction- if no keys pressed, retains previous direction
        if (yDir !== 0 || xDir !== 0) {
            this.theta = Math.atan2(-yDir, xDir);
        } 
        // Reduce speed (inertia)
        else if (this.speed > 0)
            this.speed -= GLOBAL.VELOCITY_STEP;

        // Prevent drifting due to minimal negative values
        if (this.speed < 0)
            this.speed = 0;
        
        // Change position based on speed and direction
        this.x += Math.cos(this.theta) * this.speed;
        this.y += Math.sin(this.theta) * this.speed;
        
    }

    setCoordinates(newX, newY) {
        this.x = newX;
        this.y = newY;
    }

    setData(newX, newY, newTheta, newSpeed) {
        this.setCoordinates(newX, newY);
        this.theta = newTheta;
        this.speed = newSpeed;
    }

    getTheta() {
        return this.theta;
    }

    getSpeed() {
        return this.speed;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }
}