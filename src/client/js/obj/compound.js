import { GameObject } from "./gameobject";
import { socket } from "../socket";
import { BLUEPRINTS } from "./blueprints";
import * as PIXI from 'pixi.js';

/**
 * Generic Compound which can be instantiated into the scene as a GameObject.
 * Created when a player uses a Blueprint.
 */
export class Compound extends GameObject {

    constructor(id, x, y, vx, vy, blueprint) {
        super(PIXI.loader.resources[blueprint.texture].texture, id, x, y, vx, vy);
        this.blueprint = blueprint;
    }

    /**
     * Runs once a frame.
     */
    tick() {

        // Different behaviors based on type
        switch(this.blueprint.type) {
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
}

/**
 * Creates a Compound by sending a request to the server.
 * @param {*} blueprint Then blueprint to create the compound from
 */
export function createNewCompound(blueprint) {
    socket.emit('createCompound', {
        blueprint: blueprint
    });
}

/**
 * Recreates an already spawned compound on the clientside based on server data.
 * @param {*} data Data sent from server
 */
export function createCompound(data) {
    return new Compound(data.id, data.posX, data.posY, data.vx, data.vy, data.blueprint);
}