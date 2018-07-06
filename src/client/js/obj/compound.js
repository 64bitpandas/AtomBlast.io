import { GameObject } from "./gameobject";
import { socket } from "../app";
import { BLUEPRINTS } from "./blueprints";

/**
 * Generic Compound which can be instantiated into the scene as a GameObject.
 * Created when a player uses a Blueprint.
 */
export class Compound extends GameObject {


    constructor(texture, id, x, y, vx, vy, blueprint) {
        super(texture, id, x, y, vx, vy);
        this.blueprint = blueprint;
        this.type = BLUEPRINTS[blueprint].type;
    }

    /**
     * Runs once a frame.
     */
    tick() {

        // Different behaviors based on type
        switch(this.type) {
            case 'binary':
                //do stuff
                break;
            case 'basic':
                //do other stuff (basic is essentially level 2 binary - but uses a larger scale)
                break;
            default:
                throw new Error('Blueprint ' + this.blueprint + ' could not be found!');
        }

        // Movement
        super.tick();
    }


}

/**
 * Creates a Compound by sending a request to the server.
 * @param {string} blueprint Then name of the blueprint to create the compound from
 */
export function createCompound(blueprint) {
    socket.emit('createCompound', {
        blueprint: blueprint
    });
}