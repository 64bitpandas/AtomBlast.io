// const Resources = require('./resources.js');
import {p5} from './lib/p5.min.js';
// Please comment YOUR CODE! <---- yes PLEASE !

const game = (p5) => {
  
  const playerX = window.innerWidth / 2;
  const playerY = window.innerHeight / 2;
  const playerRadius = 100;

  let playerSpeed = 5;

  // dx & dy
  let moveX = 0.0;
  let moveY = 0.0;

  // Load all resource files
  p5.preload = () => {

  }

  // Processing.js Setup Function
  p5.setup = () => {
    const canvas = p5.createCanvas(window.innerWidth, window.innerHeight); // Creates a Processing.js canvas
    canvas.parent('gameAreaWrapper'); // Makes the canvas a child component of the gameAreaWrapper div tag 
    p5.background(p5.color(0, 255, 0)); // background color will be green
    p5.noStroke(); // Removes stroke on objects
  }

  // Processing.js Draw Loop
  p5.draw = () => {
    // push();
    // translate(window.innerWidth / 2, window.innerHeight / 2);
    const shouldIncrement = false;

    const mouseXC = p5.mouseX - window.innerWidth / 2;
    const mouseYC = p5.mouseY - window.innerHeight / 2;

    const theta = Math.atan2(mouseYC, mouseXC);

    // If the mouse is outside of the player onscreen
    const move = Math.sqrt(mouseXC ** 2 + mouseYC ** 2) > playerRadius;

    if (move) {
      moveX += Math.cos(theta) * playerSpeed;
      moveY += Math.sin(theta) * playerSpeed;
    }

    // console.log(stepX, stepY);

    p5.clear();
    p5.push();
    p5.translate(-moveX, -moveY);
    p5.ellipse(200, 200, 30, 30);
    p5.ellipse(400, 400, 30, 30);
    p5.ellipse(600, 600, 30, 30);
    p5.ellipse(800, 800, 30, 30);
    p5.pop();
    p5.ellipse(playerX, playerY, 2 * playerRadius, 2 * playerRadius);
  }
}
export default game;