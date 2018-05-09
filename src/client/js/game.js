// Main script for the clientside rendering of the game using Pixi.js.

import * as PIXI from './lib/pixi.min.js';

// Initialize Pixi
let type = "WebGL";
if (!PIXI.utils.isWebGLSupported())
    type = "canvas";

// Print welcome message to console :)
PIXI.utils.sayHello(type)

// Create Application
let app = new PIXI.Application({width: window.innerWidth, height: window.innerHeight});

// Add canvas to HTML document
document.getElementById('gameAreaWrapper').appendChild(app.view);

// On resize, resize the canvas dynamically
window.addEventListener('resize', () => {
    app.view.style.width = window.innerWidth;
    app.view.style.height = window.innerHeight;
}, true);