import {GLOBAL} from '../global.js';
import * as PIXI from 'pixi.js';
import { textStyle, player, screenCenterX, screenCenterY } from '../pixigame.js';
import { socket } from '../socket.js';
import { GameObject } from '../obj/gameobject';

export class Player extends GameObject {

    /**
     * Constructor for creating a new Player in the server side.
     * Player is a Sprite instance that can be added to the stage.
     * Each Player should only be created once, and updated subsequently with
     * setData().
     * @param {PIXI.Texture} texture The texture associated with this sprite
     * @param {string} id Socket ID of the player
     * @param {string} name Name of the player
     * @param {string} room Room that the player belongs to
     * @param {string} team Team that the player belongs to
     * @param {number} health Health of the player
     * @param {number} x Global x-coordinate
     * @param {number} y Global y-coordinate
     * @param {number} vx Horizontal velocity
     * @param {number} vy Vertical velocity
     */
    constructor(texture, id, name, room, team, health, x, y, vx, vy, experience) {

        // Call GameObject
        super(texture, id, x, y, vx, vy);

        // Pixi Values
        this.width = GLOBAL.PLAYER_RADIUS * 2;
        this.height = GLOBAL.PLAYER_RADIUS * 2;

        if(id === socket.id) {
            // console.log('this player');
            this.x = screenCenterX;
            this.y = screenCenterY;
        }
        else { // take this player off screen until it can be processed
            this.hide();
        }

        // Custom fields
        this.name = name;
        this.room = room;
        this.team = team;
        this.health = health; //Set the health of the player
        this.isMoving = false;
        this.experience = experience; //Sets the experience of the player(Passed in)

        this.atoms = { // List of all atoms and the number that the player has. Continue list later
            h: 0,
            he: 0,
            c: 0,
            cl: 0,
        };
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
        this.textObjects.postext = new PIXI.Text('placeholderpos', textStyle);
        this.textObjects.teamtext = new PIXI.Text('team: ', textStyle);
        this.textObjects.healthtext = new PIXI.Text('health: ', textStyle);

        // Assign values and positions
        this.textObjects.idtext.position.set(0, GLOBAL.PLAYER_RADIUS * 9);
        this.textObjects.idtext.text += this.id;
        this.textObjects.nametext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 100);
        this.textObjects.nametext.text += this.name;
        this.textObjects.postext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 200);
        this.textObjects.teamtext.text += this.team;
        this.textObjects.teamtext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 300);

        // Create text
        for (let item in this.textObjects)
            this.addChild(this.textObjects[item]);
    }
    
    /**
    *  Decrement player health
    *  Called whenever a player damages, or collides with, another player
    *  @param {number} power
    */
    damage(power) {
        this.health -= power;
        socket.emit('damage', this.health);
    }


    /** 
    * Draws all components of a given player.
    * This method should be included in the ticker and called once a frame.
    * Therefore, all setup tasks should be called in setup().
    */
    tick() {
        
        // Movement
        super.tick();
        
        // Update text
        this.textObjects.postext.text = '(' + Math.round(this.posX) + ', ' + Math.round(this.posY) + ')';
        this.textObjects.healthtext.text = 'health: ' + this.health;

        // Draw other player
        if(this.id !== socket.id) {
            this.draw();
        }

        checkHealth();
    }

    /**
        * Adds an atom to the list
        * @param {string} id The ID of the atom to add to the player
        */
    addAtom(id) {
        this.atoms[id]++;
    }

    /**
     * Verify player health and display gameOver.
     */
    checkHealth() {
        if (this.health <= 0) {
            
        }
    }
}