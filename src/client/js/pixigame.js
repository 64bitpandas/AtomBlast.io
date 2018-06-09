import * as PIXI from 'pixi.js';
import { keyboard } from './keyboard';
import { GLOBAL } from './global';


export function init() {
    //Initialization
    let type = (!PIXI.utils.isWebGLSupported()) ? 'WebGL' : 'canvas';
    PIXI.utils.sayHello(type);
    
    //Create a Pixi Application
    let app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight});
    
    //Add the canvas that Pixi automatically created for you to the HTML document
    document.body.appendChild(app.view);

    // Renderer settings
    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(window.innerWidth, window.innerHeight);

    // Set up key listeners
    let esc = keyboard(GLOBAL.KEY_ESC),
        up = keyboard(GLOBAL.KEY_W),
        down = keyboard(GLOBAL.KEY_S),
        left = keyboard(GLOBAL.KEY_A),
        right = keyboard(GLOBAL.KEY_D);
    
    // Begin game loop
    app.ticker.add(delta => draw(delta));
}

// Game loop
function draw(delta) {
    
}