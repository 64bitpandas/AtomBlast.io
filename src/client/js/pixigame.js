import * as PIXI from 'pixi.js';
import { keyboard } from './lib/keyboard';
import { GLOBAL } from './global';
import { Player } from './obj/player';
import { hideElement, showElement} from './app';
import { socket, players, atoms } from './socket';

export var isSetup; // True after the stage is fully set up
export var player; // The player being controlled by this client
export var screenCenterX; // X-coordinate of the center of the screen
export var screenCenterY; // Y-coordinate of the center of the screen
export var app; // Pixi app

let sprites = []; // Sprites on the stage
let esc, up, down, left, right; // Key handlers

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
        console.warn("AYYYYY");
        if (Object.keys(PIXI.loader.resources).length < 1) {
            PIXI.loader
            .add(GLOBAL.PLAYER_SPRITES)
            .add(GLOBAL.ATOM_SPRITES)
            .load(setup);
        }
    }

    // If already initialized, use existing app variable
    if (isSetup) {
        console.warn("Loader already initialized!");
        for (var i = app.stage.children.length - 1; i >= 0; i--) {
            app.stage.removeChild(app.stage.children[i]);
        }
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

        esc.press = () => {
            toggleMenu();
        }

        // sprites.nametext.position.set()

        // Load sprites into stage
        for(let sprite in sprites) {
            if(sprite !== 'player')
                app.stage.addChild(sprites[sprite]);
        }

        for(let atom in atoms)
            app.stage.addChild(atoms[atom]);

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
    // Hide loading screen
    hideElement('loading');
    showElement('chatbox');

}

/**
 * Called once per frame. Updates all moving sprites on the stage.
 * @param {number} delta Time value from Pixi
 */
function draw(delta) {
    // Handle this player and movement
    if(player !== undefined) {

        // Make sure player is not in chat before checking move
        if (document.activeElement !== document.getElementById('chatInput')) {
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
        }

        // Slow down gradually - unaffected by chat input
        if (!up.isDown && !down.isDown) 
            player.vy *= GLOBAL.VELOCITY_STEP;
        if(!left.isDown && !right.isDown)
            player.vx *= GLOBAL.VELOCITY_STEP;

        // Move player
        player.tick();

        // Send coordinates
        socket.emit('move', { id: player.id, posX: player.posX, posY: player.posY, vx: player.vx, vy: player.vy });
    }
    
    // Handle other players
    for(let pl in players) {
        if(players[pl] !== player) {
            players[pl].tick();
        }
    }

    // Draw Atoms
    for(let atom in atoms) {
        atoms[atom].tick();
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