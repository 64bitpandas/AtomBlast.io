import { GameObject } from "./gameobject";
import { socket, objects } from "../socket";
import { BLUEPRINTS } from "./blueprints";
import * as PIXI from 'pixi.js';
import { app } from "../pixigame";
import { updateCompoundButtons } from "../app";

/**
 * Generic Compound which can be instantiated into the scene as a GameObject.
 * Created when a player uses a Blueprint.
 */
export class Compound extends GameObject {

    constructor(id, x, y, vx, vy, blueprint) {
        super(PIXI.loader.resources[blueprint.texture].texture, id, x, y, vx, vy);
        this.blueprint = blueprint;

        // Parse params
        for (let param in this.blueprint.params) {
            this[param] = this.blueprint.params[param];
        }

        // Use params
        switch (this.blueprint.type) {
            case 'binary':
                this.width = this.size*4;
                this.height = this.size*4;
                break;
            case 'basic':
                this.width = this.size*6;
                this.height = this.size*6;
                break;
        }
    }

    /**
     * Runs once a frame.
     */
    tick() {
        // Different behaviors based on type
        switch (this.blueprint.type) {
            case 'binary':
                //do stuff
                break;
            case 'basic':
                //do other stuff (basic is essentially level 2 binary - but uses a larger scale)
                break;
            default:
                throw new Error('Blueprint ' + this.blueprint.name + ' could not be found!');
        }

        // Movement
        super.tick();
        this.draw();
    }

    /**
     * Run when players are nearby to check if they picked this atom up.
     * If the player is nearby but not close enough to pick up, then it becomes attracted towards the player.
     * @param {Player} player Player to check collision against
     * @returns true if collision detected, false otherwise
     */
    checkCollision() {
        if (player === undefined)
            return false;

        for (let objType in objects) {
            if (objType !== 'atoms')
                for (let obj in objects[objType]) {
                    let distance = distanceBetween(this, objects[objType][obj]);

                    // Collision with player or other powerup
                    if (distance < GLOBAL.ATOM_RADIUS + GLOBAL.PLAYER_RADIUS) {
                        socket.emit('compoundCollision', { id: this.id, collidedWith: obj });
                        return true;
                    }
                }
        }

        return false;
    }
}

/**
 * Creates a Compound by sending a request to the server.
 * @param {*} blueprint Then blueprint to create the compound from
 * @param {int} xIn x-coords
 * @param {int} yIn y-coords
 */
export function createNewCompound(blueprint, xIn, yIn) {
    updateCompoundButtons();
    // let cursor = app.renderer.plugins.interaction.mouse.global;

    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    // console.log(centerX - cursor.x, cursor.y - centerY)
    socket.emit('createCompound', {
        blueprint: blueprint,
        // mousePos: { x: cursor.x - centerX, y: centerY - cursor.y }
        mousePos: {x: xIn - centerX, y: centerY - yIn}
    });
}

/**
 * Recreates an already spawned compound on the clientside based on server data.
 * @param {*} data Data sent from server
 */
export function createCompound(data) {
    return new Compound(data.id, data.posX, data.posY, data.vx, data.vy, data.blueprint);
}