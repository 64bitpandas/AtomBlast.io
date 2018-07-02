import * as PIXI from 'pixi.js';
import { app, screenCenterX, screenCenterY, player } from '../pixigame';
import { GLOBAL } from '../global';

/**
 * GameObject class that all objects in the game space should inherit.
 * Provides standard field variables such as posX and posY, as well as 
 * standard methods to manipulate them.
 * 
 * A GameObject cannot be added directly; it must be inherited.
 * setup() and tick() must be overridden.
 */
export class GameObject extends PIXI.Sprite {

    /**
     * Creates a new GameObject.
     * @param {PIXI.Texture} texture The texture associated with this sprite
     * @param {string} id Unique identifier- for example, socket ID for players, numerical ID for powerups
     * @param {number} x Global x-coordinate
     * @param {number} y Global y-coordinate
     * @param {number} vx Horizontal velocity
     * @param {number} vy Vertical velocity
     */
    constructor(texture, id, x, y, vx, vy) {
        super(texture);
        this.id = id;
        this.posX = x;
        this.posY = y;
        this.vx = vx;
        this.vy = vy;
        
        app.stage.addChild(this);
    }

    /**
     * Sets global coordinates of this player
     * @param {number} newX New x-coordinate to move to
     * @param {number} newY New y-coordinate to move to
     */
    setCoordinates(newX, newY) {
        this.posX = newX;
        this.posY = newY;
    }

    /**
     * Sets global coordinates and speeds of this player
     * @param {number} newX New x-coordinate to move to
     * @param {number} newY New y-coordinate to move to
     * @param {number} newX New x velocity
     * @param {number} newY New y velocity
     */
    setData(newX, newY, vx, vy) {
        this.setCoordinates(newX, newY);
        this.vx = vx;
        this.vy = vy;
    }

    /**
     * Call during tick() if necessary. 
     * Draws powerup in the correct position on the player screen.
     */
    draw() {
        this.x = screenCenterX + this.posX - player.posX + GLOBAL.POWERUP_RADIUS;
        this.y = screenCenterY + player.posY - this.posY + GLOBAL.POWERUP_RADIUS;
    }

    /**
     * Moves this player to (9999, 9999) on local screen space, effectively
     * hiding it from view.
     */
    hide() {
        this.x = 9999;
        this.y = 9999;
    }

    /**
     * Override optional. Called once, during game setup phase.
     */
    setup() {
    }

    /**
     * Override optional. Default behavior: handles movement. Call super.tick() from child class if movable.
     */
    tick() {
        // Prevent drifting due to minimal negative values
        if (Math.abs(this.vx) < GLOBAL.DEADZONE)
            this.vx = 0;
        if (Math.abs(this.vy) < GLOBAL.DEADZONE)
            this.vy = 0;

        // Change position based on speed and direction
        this.posX += this.vx;
        this.posY += this.vy;
    }
}