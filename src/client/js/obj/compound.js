import { GameObject } from './gameobject';
import { socket, objects } from '../socket';
import { BLUEPRINTS } from './blueprints';
import * as PIXI from 'pixi.js';
import { app, player } from '../pixigame';
import { updateCompoundButtons } from '../app';
import { GLOBAL, distanceBetween } from '../global.js';
import { MAP_LAYOUT } from './tiles';

/**
 * Generic Compound which can be instantiated into the scene as a GameObject.
 * Created when a player uses a Blueprint.
 */
export class Compound extends GameObject {

    constructor(id, x, y, vx, vy, blueprint, sendingTeam) {
        super(PIXI.loader.resources[blueprint.texture].texture, id, x, y, vx, vy);
        this.blueprint = blueprint;
        this.sendingTeam = sendingTeam;
        this.ignited = false; // Becomes true if this compound passes over a flame tile

        // Parse params
        for (let param in this.blueprint.params) {
            this[param] = this.blueprint.params[param];
        }

        // Use params
        this.width = this.size;
        this.height = this.size;

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
        case 'stream':
            break;
        case 'flammable':
            let tileCol = Math.floor(this.posX / (GLOBAL.GRID_SPACING * 2));
            let tileRow = Math.floor(this.posY / (GLOBAL.GRID_SPACING * 2));
            if (MAP_LAYOUT[MAP_LAYOUT.length - tileRow - 2] !== undefined && MAP_LAYOUT[MAP_LAYOUT.length - tileRow - 2][tileCol] === 'F' && !this.ignited) {
                console.log('IGNITE');
                this.ignited = true;
                this.texture = PIXI.loader.resources[GLOBAL.IGNITE_SPRITE].texture;
            }
            break;

        default:
            throw new Error('Blueprint ' + this.blueprint.name + ' has invalid type ' + this.blueprint.type);
        }

        this.checkCollision();

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
        // No friendly fire
        if(this.sendingTeam === player.team)
            return false;

        let distance = distanceBetween(
            { posX: this.posX + this.width / 2, posY: this.posY - this.height / 2 },
            { posX: player.posX + GLOBAL.PLAYER_RADIUS, posY: player.posY - GLOBAL.PLAYER_RADIUS });
        
        // Hit player
        if (distance < this.blueprint.params.size + GLOBAL.PLAYER_RADIUS) {
            player.health -= this.blueprint.params.damage;
            if(!this.ignited)
                socket.emit('compoundCollision', { id: this.id, sender: socket.id, damage: this.blueprint.params.damage });
            else
                socket.emit('compoundCollision', { id: this.id, sender: socket.id, damage: this.blueprint.params.ignitedDamage, splash: this.blueprint.params.splash }); 
            return true;
        }
        // for (let objType in objects) {
        //     if (objType !== 'atoms')
        //         for (let obj in objects[objType]) {
        //             let distance = distanceBetween(this, objects[objType][obj]);

        //             // Collision with player or other powerup
        //             if (distance < GLOBAL.ATOM_RADIUS + GLOBAL.PLAYER_RADIUS) {
        //                 socket.emit('compoundCollision', { id: this.id, collidedWith: obj });
        //                 return true;
        //             }
        //         }
        // }

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


    if(blueprint.type === 'speed') {
        // this.hide();
        player.speedMult += blueprint.params.speedFactor * (1/player.speedMult);
        console.log('New speed is ' + player.speedMult);
    }
    else if(blueprint.type === 'health'){
        socket.emit('damage', {damage: -blueprint.params.healthModifier, id: socket.id});
        if(player.health > GLOBAL.MAX_HEALTH){
            player.health = GLOBAL.MAX_HEALTH;
        }
    }
    else {
        // let cursor = app.renderer.plugins.interaction.mouse.global;

        let centerX = window.innerWidth / 2;
        let centerY = window.innerHeight / 2;
        // console.log(centerX - cursor.x, cursor.y - centerY)
        socket.emit('createCompound', {
            blueprint: blueprint,
            sendingTeam: player.team,
            // mousePos: { x: cursor.x - centerX, y: centerY - cursor.y }
            mousePos: { x: xIn - centerX, y: centerY - yIn }
        });

        if(blueprint.type === 'stream')
            for(let i = 0; i < blueprint.params.length - 1; i++)
                setTimeout(() => {
                    socket.emit('createCompound', {
                        blueprint: blueprint,
                        sendingTeam: player.team,
                        // mousePos: { x: cursor.x - centerX, y: centerY - cursor.y }
                        mousePos: { x: xIn - centerX, y: centerY - yIn },
                        streamNumber: i
                    });
                }, blueprint.params.spacing * i);
                

    }

    //Emits the crafting event to update experience
    socket.emit('experienceEvent', {
        event: 'CRAFT'
    });

}

/**
 * Recreates an already spawned compound on the clientside based on server data.
 * @param {*} data Data sent from server
 */
export function createCompound(data) {
    return new Compound(data.id, data.posX, data.posY, data.vx, data.vy, data.blueprint, data.sendingTeam);
}