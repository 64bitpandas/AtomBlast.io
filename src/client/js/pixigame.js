import * as PIXI from 'pixi.js';
import { keyboard } from './lib/keyboard';
import { GLOBAL } from './global';
import { Player } from './obj/player';
import { hideElement, showElement, selectedBlueprints, updateAtomList} from './app';
import { socket, objects } from './socket';
import { BLUEPRINTS } from './obj/blueprints';
import { createNewCompound } from './obj/compound'

export var isSetup; // True after the stage is fully set up
export var player; // The player being controlled by this client
export var screenCenterX; // X-coordinate of the center of the screen
export var screenCenterY; // Y-coordinate of the center of the screen
export var app; // Pixi app
export var inGame = false; // True after game has begun

// let sprites = []; // Sprites on the stage

let esc, up, down, left, right, blueprintKeys; // Key handlers
let moveKeys = [];

let vertLines = [];
let horizLines = [];

// Add text
export let textStyle = new PIXI.TextStyle({
    fill: 'black',
    fontSize: 120
})

export function init() {
    if (!isSetup) {
        //Initialization
        let type = (PIXI.utils.isWebGLSupported()) ? 'WebGL' : 'canvas';
        PIXI.utils.sayHello(type);
        
        //Create a Pixi Application
        app = new PIXI.Application(0, 0, {view: document.getElementById('gameView')});
        //Add the canvas that Pixi automatically created for you to the HTML document
        // document.body.appendChild(app.view);

        // Renderer settings
        app.renderer.autoResize = true;
        app.renderer.resize(window.innerWidth, window.innerHeight);
        screenCenterX = window.innerWidth / 2 - GLOBAL.PLAYER_RADIUS;
        screenCenterY = window.innerHeight / 2 - GLOBAL.PLAYER_RADIUS;

        // Load resources if not already loaded
        let TEXTURES = [];
        for(let bp in BLUEPRINTS) {
            // Prevent duplicate textures from being loaded
            if(TEXTURES.indexOf(BLUEPRINTS[bp].texture) < 0)
                TEXTURES.push(BLUEPRINTS[bp].texture);
        }
        for(let atom of GLOBAL.ATOM_SPRITES)
            if (TEXTURES.indexOf(atom) < 0)
                TEXTURES.push(atom);
        

        if (Object.keys(PIXI.loader.resources).length < 1) {
            PIXI.loader
            .add(GLOBAL.PLAYER_SPRITES)
            .add(TEXTURES)
            .load(setup);
        }
    }

    // If already initialized, use existing app variable
    if (isSetup) {
        console.info("Stage already initialized!");
        clearStage();
        setup();
    }
}

/**
 * Sets up the stage. Call after init(), and begins the draw() loop once complete.
 */
function setup() {
   if(!isSetup) {
        // Set up key listeners
        esc = keyboard(GLOBAL.KEY_ESC);
        up = keyboard(GLOBAL.KEY_W);
        down = keyboard(GLOBAL.KEY_S);
        left = keyboard(GLOBAL.KEY_A);
        right = keyboard(GLOBAL.KEY_D);
        
        //All the movement keys for easy access
        moveKeys = [up, down, right, left];
        //Set up the blueprint key listeners
        blueprintKeys = [
            keyboard(GLOBAL.KEY_1),
            keyboard(GLOBAL.KEY_2),
            keyboard(GLOBAL.KEY_3),
            keyboard(GLOBAL.KEY_4)
        ]
        
        esc.press = () => {
            if (isFocused()) {
                if (document.activeElement !== document.getElementById('chatInput'))
                    toggleMenu();
                else
                    document.getElementById('chatInput').blur();
            }
        }

        // Chat box styling on select
        document.getElementById('chatInput').onfocus = () => {
            document.getElementById('chatbox').style.boxShadow = '0px 0px 1rem 0px #311B92';
        }

        document.getElementById('chatInput').onblur = () => {
            document.getElementById('chatbox').style.boxShadow = '0px 0px 1rem 0px rgba(180,180,180)';
        }

        //Bind each blueprint key
        for(let key in blueprintKeys){
            blueprintKeys[key].press = () => {
                if(isFocused()){
                    //Creates a compound of that certain blueprint
                    if (canCraft(selectedBlueprints[key])) {
                        createNewCompound(selectedBlueprints[key]); 

                        // Subtract atoms needed to craft
                        deductCraftMaterial(electedBlueprints[key]);
                    }
                    else
                        console.log("Not enough atoms to craft this blueprint!");
                }
            }
        }

        // Background
        app.renderer.backgroundColor = 0xFFFFFF;

        // Resize
        document.getElementsByTagName('body')[0].onresize = () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
            screenCenterX = window.innerWidth / 2 - GLOBAL.PLAYER_RADIUS;
            screenCenterY = window.innerHeight / 2 - GLOBAL.PLAYER_RADIUS;
            player.x = screenCenterX;
            player.y = screenCenterY;
        }

        // Begin game loop
        app.ticker.add(delta => draw(delta));
    }
    
    isSetup = true; 

    // Draw grid
    // Grid
    let line;
    for (let x = 0; x < window.innerWidth / GLOBAL.GRID_SPACING; x++) {
        line = new PIXI.Graphics();
        line.lineStyle(GLOBAL.GRID_LINE_STROKE, GLOBAL.GRID_LINE_COLOUR, 1);
        line.oX = x * GLOBAL.GRID_SPACING;
        line.moveTo(line.oX, 0);
        line.lineTo(line.oX, window.innerHeight);
        vertLines.push(line);
        app.stage.addChild(line);
    }
    for (let y = 0; y < window.innerHeight / GLOBAL.GRID_SPACING; y++) {
        line = new PIXI.Graphics();
        line.lineStyle(GLOBAL.GRID_LINE_STROKE, GLOBAL.GRID_LINE_COLOUR, 1);
        line.oY = y * GLOBAL.GRID_SPACING;
        line.moveTo(0, line.oY);
        line.lineTo(window.innerWidth, line.oY);
        horizLines.push(line);
        app.stage.addChild(line);
    }

    showGameUI();
    

}

/**
 * Called once per frame. Updates all moving sprites on the stage.
 * @param {number} delta Time value from Pixi
 */
function draw(delta) {
    // Handle this player and movement
    if(player !== undefined) {

        // Make sure player is not in chat before checking move
        if (document.activeElement !== document.getElementById('chatInput') && document.hasFocus() && inGame) {
            if (left.isDown)
                player.vx = -GLOBAL.MAX_SPEED;
            if (right.isDown)
                player.vx = GLOBAL.MAX_SPEED;
            if (up.isDown) 
                player.vy = GLOBAL.MAX_SPEED;
            if (down.isDown)
                player.vy = -GLOBAL.MAX_SPEED;  
            player.isMoving = (up.isDown || down.isDown || left.isDown || right.isDown);
        } else {
            player.isMoving = false;
            
            //Because the document is not focused disable all keys(Stops moving!)
            for(let key in moveKeys){
                moveKeys[key].isDown = false;
                moveKeys[key].isUp = true;
            }
        }

        // Slow down gradually - unaffected by chat input
        if (!up.isDown && !down.isDown) 
            player.vy *= GLOBAL.VELOCITY_STEP;
        if(!left.isDown && !right.isDown)
            player.vx *= GLOBAL.VELOCITY_STEP;

        // Move player
        player.tick();

        // Send coordinates
        socket.emit('move', { type: 'players', id: player.id, posX: player.posX, posY: player.posY, vx: player.vx, vy: player.vy });

        // Move grid
        for (let line of vertLines)
            line.x = line.oX - player.posX % (GLOBAL.GRID_SPACING * 2);

        for (let line of horizLines)
            line.y = line.oY + player.posY % (GLOBAL.GRID_SPACING * 2);
    }
    
    // Handle objects except for this player
    for(let objType in objects) {
        for(let obj in objects[objType])
            if(objType !== 'players' || player !== objects[objType][obj])
                objects[objType][obj].tick();
    }

}

/**
 * Shows or hides the in-game menu box
 */
function toggleMenu() {
    if (document.getElementById('menubox').offsetParent === null)
        showElement('menubox');
    else
        hideElement('menubox');
}

/**
 * Remove all elements pre-rendered on stage.
 */
function clearStage() {
    for (var i = app.stage.children.length - 1; i >= 0; i--) {
        app.stage.removeChild(app.stage.children[i]);
    }
}

/**
 * Destroy everything in PIXI. DANGEROUS avoid!
 */
export function destroyPIXI() {
    app.destroy(true, { children: true, texture: true, baseTexture: true});
    PIXI.loader.reset();
    isSetup = false;
    app = undefined;
}

/**
 * Call this function to hide loading div and show UI
 */
export function showGameUI() {
    // Hide loading screen
    hideElement('loading');
    showElement('lobby');
}

/**
 * Creates a Player instance once the stage is fully set up and ready.
 * @param {*} data Starting values to assign to the player. Generated from server
 * @returns {Player} The Player object that was created
 */
export function createPlayer(data) {
    if(isSetup) {
        console.log('create player ' + data.id);
        console.log(data);
        let newPlayer = new Player(PIXI.loader.resources[GLOBAL.PLAYER_SPRITES[0]].texture, data.id, data.name, data.room, data.team, data.health, data.posX, data.posY, data.vx, data.vy);
        if(data.id === socket.id)
            player = newPlayer;
        return newPlayer;
    }
}

/**
 * If the document is Focused return true otherwise false
 **/
export function isFocused(){
    return document.hasFocus();
}

/**
 * Returns true if the player has the materials necessary to create a particular blueprint.
 * @param {string} blueprint The name of the blueprint to check.
 */
export function canCraft(blueprint) {
    for (let atom in blueprint.atoms) {
        if (player.atoms[atom] === undefined || player.atoms[atom] < blueprint.atoms[atom])
            return false;
    }

    return true;
}

/**
 * Deduct material needed to craft. 
 * @param {string} blueprint The name of the blueprint to check.
 * @returns {boolean} Returns true if success, false if fail.
 */
export function deductCraftMaterial(blueprint) {
    if (canCraft) {
        for (let atom in blueprint.atoms) {
            player.atoms[atom] -= blueprint.atoms[atom];
            updateAtomList(atom);
        }
        return true;
    }
    return false;
}

/**
 * Starts the game after lobby closes.
 * @param {boolean} emit True if this client should emit the event to the server.
 */
export function startGame(emit) {
    inGame = true;
    hideElement('lobby');
    showElement('hud');
    console.log(emit);
    if(emit)
        socket.emit('startGame', {start: true});
}