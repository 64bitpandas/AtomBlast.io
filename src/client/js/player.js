import {GLOBAL} from './global.js';
import * as PIXI from 'pixi.js';
import { textStyle, player, screenCenterX, screenCenterY } from './pixigame.js';
import { socket } from './app.js';

export class Player extends PIXI.Sprite {

    /**
     * Constructor for creating a new Player in the server side.
     * Player is a Sprite instance that can be added to the stage.
     * Each Player should only be created once, and updated subsequently with
     * setData().
     * @param {PIXI.Texture} texture The texture associated with this sprite
     * @param {string} id Socket ID of the player
     * @param {string} name Name of the player
     * @param {string} room Room that the player belongs to
     * @param {number} x Global x-coordinate
     * @param {number} y Global y-coordinate
     * @param {number} vx Horizontal velocity
     * @param {number} vy Vertical velocity
     */
    constructor(texture, id, name, room, x, y, vx, vy) {

        // PIXI values
        super(texture);
        this.width = GLOBAL.PLAYER_RADIUS * 2;
        this.height = GLOBAL.PLAYER_RADIUS * 2;

        if(id === socket.id) {
            console.log('this player');
            this.x = screenCenterX;
            this.y = screenCenterY;
        }
        else { // take this player off screen until it can be processed
            this.hide();
        }

        // Custom fields
        this.id = id;
        this.name = name;
        this.room = room;
        this.isMoving = false;
        this.posX = x;
        this.posY = y;
        this.vx = vx;
        this.vy = vy;
        this.powerups = [];
        this.textObjects = {}; // Contains Text to be drawn under the player (name, id, etc)

        this.setup();
    }

    /**
     * First-time setup for this player. All of the functions in this method will only be called once.
     */
    setup() {
        // Create text objects
        this.textObjects.nametext = new PIXI.Text('name: ', textStyle);
        this.textObjects.idtext = new PIXI.Text('id: ', textStyle);
        this.textObjects.postext = new PIXI.Text('x', textStyle);

        // Assign values and positions
        this.textObjects.idtext.position.set(0, GLOBAL.PLAYER_RADIUS * 9);
        this.textObjects.idtext.text += this.id;
        this.textObjects.nametext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 100);
        this.textObjects.nametext.text += this.name;
        this.textObjects.postext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 200);

        // Create text
        for (let item in this.textObjects)
            this.addChild(this.textObjects[item]);
    }
    
  /** 
   * Draws all components of a given player and handles movement.
   * This method should be included in the ticker and called once a frame.
   * Therefore, all setup tasks should be called in setup().
   */
    tick() {
        
        // Prevent drifting due to minimal negative values
        if (Math.abs(this.vx) < GLOBAL.DEADZONE)
            this.vx = 0;
        if (Math.abs(this.vy) < GLOBAL.DEADZONE)
            this.vy = 0;
        
        // Change position based on speed and direction
        this.posX = Math.round(this.posX + this.vx);
        this.posY = Math.round(this.posY + this.vy);
        
        // Update text
        this.textObjects.postext.text = '(' + this.posX + ', ' + this.posY + ')';

        // Draw other player
        if(this.id !== socket.id) {
            this.x = screenCenterX + this.posX - player.posX;
            this.y = screenCenterY + player.posY - this.posY;
        }
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
}