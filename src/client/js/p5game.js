import {p5} from './lib/p5.min.js';
import {GLOBAL} from './global.js';
// Please comment YOUR CODE! <---- yes PLEASE !

const game = (p5) => {

  let playerSpeed = GLOBAL.MAX_SPEED;

  // dx & dy
  let posX = 0.0;
  let posY = 0.0;
  let theta = 0.0;

  // Mouse is pressed down
  let mouse = false;

  // Load all resource files
  p5.preload = () => {

  }

  // Processing.js Setup Function
  p5.setup = () => {
    let canvas = p5.createCanvas(window.innerWidth, window.innerHeight); // Creates a Processing.js canvas
    canvas.parent('gameAreaWrapper'); // Makes the canvas a child component of the gameAreaWrapper div tag 
    p5.background(p5.color(0, 255, 0)); // background color will be green
    p5.noStroke(); // Removes stroke on objects
  }

  // Processing.js Draw Loop
  p5.draw = () => {
    // push();
    // translate(window.innerWidth / 2, window.innerHeight / 2);

    const mouseXC = p5.mouseX - window.innerWidth / 2;
    const mouseYC = p5.mouseY - window.innerHeight / 2;

    // If the mouse is outside of the player onscreen (boolean)
    const move = Math.sqrt(mouseXC ** 2 + mouseYC ** 2) > GLOBAL.PLAYER_RADIUS;
    
    // Set speed and direction
    if (move && mouse) {
      playerSpeed = GLOBAL.MAX_SPEED;
      theta = Math.atan2(mouseYC, mouseXC);
    }
    else {
      if(playerSpeed > 0)
        playerSpeed -= GLOBAL.VELOCITY_STEP;
    }

    // Change position based on speed and direction
    posX += Math.cos(theta) * playerSpeed;
    posY += Math.sin(theta) * playerSpeed;

    // Clears the frame
    p5.clear();

    // Start Transformations
    p5.push();
    
    // Translate coordinate space
    p5.translate(-posX, -posY);

    // Temporary testing orbs
    p5.ellipse(200, 200, 30, 30);
    p5.ellipse(400, 400, 30, 30);
    p5.ellipse(600, 600, 30, 30);
    p5.ellipse(800, 800, 30, 30);
    
    // End Transformations
    p5.pop();

    // Draw player in the center of the screen
    p5.ellipse(window.innerWidth / 2, window.innerHeight / 2, 2 * GLOBAL.PLAYER_RADIUS, 2 * GLOBAL.PLAYER_RADIUS);
  }

  // document.getElementById('').onclick = () => {
  //   canvas.focus();
  // }

  // Mouse press/release actions
  p5.mousePressed = () => {
    mouse = true;
  }

  p5.mouseReleased = () => {
    mouse = false;
  }
  
}
export default game;