import {GLOBAL} from './global.js';
import * as PIXI from 'pixi.js';

export class Player extends PIXI.Sprite {

    /**
     * Constructor for creating a new Player in the server side.
     * Player is a Graphics instance for drawing primitives,
     * but will eventually be a Sprite instance that can be added to the stage.
     * @param {PIXI.Texture} texture The texture associated with this sprite
     * @param {string} id Socket ID of the player
     * @param {string} name Name of the player
     * @param {string} room Room that the player belongs to
     */
    constructor(texture, id, name, room, x, y, vx, vy, powerups) {
        super(texture);
        this.id = id;
        this.name = name;
        this.room = room;
        this.width = GLOBAL.PLAYER_RADIUS * 2;
        this.height = GLOBAL.PLAYER_RADIUS * 2;

        // Creating local player
        if(arguments.length <= 4) {
            this.x = window.innerWidth / 2 - GLOBAL.PLAYER_RADIUS;
            this.y = window.innerHeight / 2 - GLOBAL.PLAYER_RADIUS;
            this.posX = 0;
            this.posY = 0;
            this.vx = 0;
            this.vy = 0;
            this.powerups = [];
        }

        // Constructor for reconstructing a player on the Client side
        else {
            this.posX = x;
            this.posY = y;
            this.vx = vx;
            this.vy = vy;
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

    move(delta) {

        // Set direction- if no keys pressed, retains previous direction
        let theta;
        if (vx !== 0 && vy !== 0) {
            theta = Math.atan2(-vy, vx);
        } 
        // Reduce speed (inertia)
        if (this.speed > 0 && vx === 0 && vy === 0)
            this.speed -= GLOBAL.VELOCITY_STEP;

        // Prevent drifting due to minimal negative values
        if (this.speed < 0)
            this.speed = 0;
        
        // Change position based on speed and direction
        this.posX += this.vx + delta;
        this.posY += this.vy + delta;
        
    }

    setCoordinates(newX, newY) {
        this.posX = newX;
        this.posY = newY;
    }

    setData(newX, newY, vx, vy) {
        this.setCoordinates(newX, newY);
        this.vx = vx;
        this.vx = vy;
    }
}