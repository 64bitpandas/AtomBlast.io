import * as PIXI from 'pixi.js';

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
     * @param {*} id Unique identifier- for example, socket ID for players, numerical ID for powerups
     * @param {*} room Room that the object is in
     * @param {*} x Global x-coordinate
     * @param {*} y Global y-coordinate
     */
    constructor(texture, id, room, x, y) {
        super(texture);
        this.id = id;
        this.room = room;
        this.posX = x;
        this.posY = y;
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
     * Moves this player to (9999, 9999) on local screen space, effectively
     * hiding it from view.
     */
    hide() {
        this.x = 9999;
        this.y = 9999;
    }

    /**
     * MUST OVERRIDE! Called once, during game setup phase.
     */
    setup() {
        throw new Error('setup() must be overridden! in this GameObject!');
    }

    /**
     * MUST OVERRIDE! Called once a frame after setup.
     */
    tick() {
        throw new Error('tick() must be overridden! in this GameObject!');
    }
}