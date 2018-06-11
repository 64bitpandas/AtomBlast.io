import * as PIXI from 'pixi.js';
import { keyboard } from './keyboard';
import { GLOBAL } from './global';
import { Player } from './player';
import { hideElement, showElement } from './app';

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

    isSetup = true; 
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
    sprites.nametext = new PIXI.Text('name');
    sprites.idtext = new PIXI.Text('id');
    sprites.xtext = new PIXI.Text('x');
    sprites.ytext = new PIXI.Text('y');
    // sprites.nametext.position.set()

    // Load sprites into stage
    for(let sprite in sprites)
        app.stage.addChild(sprites[sprite]);

    // Begin game loop
    app.ticker.add(delta => draw(delta));

    // Load player
    // player = new Player(PIXI.loader.resources[GLOBAL.PLAYER_SPRITE].texture);


    // Resize
    document.getElementsByTagName('body')[0].onresize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        player.x = window.innerWidth / 2 - GLOBAL.PLAYER_RADIUS;
        player.y = window.innerHeight / 2 - GLOBAL.PLAYER_RADIUS;
    }

    // createPlayer({id: 0, name: 0, room: 0});

}

// Game loop
function draw(delta) {
    // Background
    app.renderer.backgroundColor = 0x000000;
    // Handle this player
    if(up.isDown)
        player.vy = GLOBAL.MAX_SPEED;
    if(down.isDown)
        player.vy = -GLOBAL.MAX_SPEED;
    if(left.isDown)
        player.vx = -GLOBAL.MAX_SPEED;
    if(right.isDown)
        player.vx = GLOBAL.MAX_SPEED;
    
    // Handle other players
}

function toggleMenu() {
    if (document.getElementById('menubox').offsetParent === null)
        showElement('menubox');
    else
        hideElement('menubox');
}

export function createPlayer(data) {
    if(PIXI.loader.resources[GLOBAL.PLAYER_SPRITE] !== undefined) {
        console.log('create player');
        player = new Player(PIXI.loader.resources[GLOBAL.PLAYER_SPRITE].texture, data.id, data.name, data.room);
        app.stage.addChild(player);



        console.log(player);
        return player;
    }
}