// Main script for the clientside rendering of the game using Pixi.js.

import * as PIXI from './lib/pixi.min.js';

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported())
    type = "canvas";

PIXI.utils.sayHello(type)
