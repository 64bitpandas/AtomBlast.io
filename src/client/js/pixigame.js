import * as PIXI from 'pixi.js';
import { keyboard } from './keyboard';
import { GLOBAL } from './global';
import { Player } from './player';
import { hideElement, showElement, socket } from './app';

export var isSetup;
let player;
let app;
let sprites = [];

let esc, up, down, left, right;

export function init() {
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

    // Load resources
    PIXI.loader
        .add(GLOBAL.PLAYER_SPRITE)
        .load(setup);


}

function setup() {

   
    // Set up key listeners
    esc = keyboard(GLOBAL.KEY_ESC);
    up = keyboard(GLOBAL.KEY_W);
    down = keyboard(GLOBAL.KEY_S);
    left = keyboard(GLOBAL.KEY_A);
    right = keyboard(GLOBAL.KEY_D);

    esc.press = () => {
        toggleMenu();
    }

    // Hide loading screen
    hideElement('loading');
    showElement('chatbox');

    // Add text
    let textStyle = new PIXI.TextStyle({
        fill: 'white',
        fontSize: 80
    })
    
    sprites.player = {};
    sprites.player.nametext = new PIXI.Text('name', textStyle);
    sprites.player.idtext = new PIXI.Text('id', textStyle);
    sprites.player.xtext = new PIXI.Text('x', textStyle);
    sprites.player.ytext = new PIXI.Text('y', textStyle);

    // sprites.nametext.position.set()

    // Load sprites into stage
    for(let sprite in sprites) {
        if(sprite !== 'player')
            app.stage.addChild(sprites[sprite]);
    }

    // Load player
    // player = new Player(PIXI.loader.resources[GLOBAL.PLAYER_SPRITE].texture);


    // Resize
    document.getElementsByTagName('body')[0].onresize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        player.x = window.innerWidth / 2 - GLOBAL.PLAYER_RADIUS;
        player.y = window.innerHeight / 2 - GLOBAL.PLAYER_RADIUS;
    }

    // createPlayer({id: 0, name: 0, room: 0});
    isSetup = true; 

    // Begin game loop
    app.ticker.add(delta => draw(delta));

}

// Game loop
function draw(delta) {
    // Background
    app.renderer.backgroundColor = 0x000000;
    // Handle this player
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

            if(!up.isDown && !down.isDown) {
                player.vy *= GLOBAL.VELOCITY_STEP;
            }
            if(!left.isDown && !right.isDown) {
                player.vx *= GLOBAL.VELOCITY_STEP;
            }

            
            player.isMoving = (up.isDown || down.isDown || left.isDown || right.isDown);
        } else
            player.isMoving = false;

        sprites.player.ytext.text = player.posY;
        sprites.player.xtext.text = player.posX;

        // Move player
        player.move();

        // Send coordinates
        socket.emit('move', { id: player.id, posX: player.posX, posY: player.posY, vx: player.vx, vy: player.vy });
    }

    
    
    // Handle other players
}

function toggleMenu() {
    if (document.getElementById('menubox').offsetParent === null)
        showElement('menubox');
    else
        hideElement('menubox');
}

export function createPlayer(data) {
    if(PIXI.loader.resources[GLOBAL.PLAYER_SPRITE] !== undefined && isSetup) {
        console.log('create player');
        player = new Player(PIXI.loader.resources[GLOBAL.PLAYER_SPRITE].texture, data.id, data.name, data.room);
        app.stage.addChild(player);

        // Create text
        for (let item in sprites.player)
            player.addChild(sprites.player[item]);
        sprites.player.idtext.position.set(0, GLOBAL.PLAYER_RADIUS * 9);
        sprites.player.idtext.text = data.id;
        sprites.player.nametext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 100);
        sprites.player.nametext.text = data.name;
        sprites.player.xtext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 200);
        sprites.player.ytext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 300);

        return player;
    }
}