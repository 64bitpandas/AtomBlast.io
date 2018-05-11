/// <reference path="./lib/p5.global-mode.d.ts" />
import { p5 } from './lib/p5.min.js';
import { GLOBAL } from './global.js';
import { players, socket } from './app.js';
// Please comment YOUR CODE! <---- yes PLEASE !

const game = (p5) => {
  let playerSpeed = GLOBAL.MAX_SPEED;
  // dx & dy
  let posX = 0.0;
  let posY = 0.0;
  let theta = 0.0;

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
    if (move && p5.mouseIsPressed) {
      playerSpeed = GLOBAL.MAX_SPEED;
      theta = Math.atan2(mouseYC, mouseXC);
    }
    else {
      if (playerSpeed > 0)
        playerSpeed -= GLOBAL.VELOCITY_STEP;
    }

    // Prevent drifting due to minimal negative values
    if(playerSpeed < 0)
      playerSpeed = 0;

    // Change position based on speed and direction
    posX += Math.cos(theta) * playerSpeed;
    posY += Math.sin(theta) * playerSpeed;

    // Clears the frame
    p5.clear();

    // Start Transformations
    p5.push();

    // Translate coordinate space
    p5.translate(window.innerWidth / 2, window.innerHeight / 2);
    p5.translate(-posX, -posY);

    // Temporary testing orbs
    p5.ellipse(200, 200, 30, 30);
    p5.ellipse(400, 400, 30, 30);
    p5.ellipse(600, 600, 30, 30);
    p5.ellipse(800, 800, 30, 30);

    // // Draw player in the center of the screen 0,0 doesnt work at all
    // p5.ellipse(posX, posY, 2 * GLOBAL.PLAYER_RADIUS, 2 * GLOBAL.PLAYER_RADIUS);
    // p5.text(pl.name, posX, posY);

    // // Debug lines
    // p5.text("x: " + Math.round(posX), posX, posY - 30);
    // p5.text("y: " + Math.round(posY), posX, posY - 15);
    // p5.text("ID: " + socket.id.substring(0, 6), posX, posY + 15);

    // Draw other players
    // console.log(players);
    for (let player in players) {
      let pl = players[player];
      if (pl !== null && pl.id !== socket.id) {
          // console.log(pl);
          p5.ellipse(pl.x, pl.y, 2 * GLOBAL.PLAYER_RADIUS);
          p5.text(pl.name, pl.x, pl.y);

          // Debug lines
          p5.text("x: " + Math.round(pl.x), pl.x, pl.y - 30);
          p5.text("y: " + Math.round(pl.y), pl.x, pl.y - 15);
          p5.text("ID: " + pl.id.substring(0, 6), pl.x, pl.y + 15);
      }
    }

    // Draw player in the center of the screen 0,0 doesnt work at all
    if(socket.id !== undefined) {
      p5.ellipse(posX, posY, 2 * GLOBAL.PLAYER_RADIUS, 2 * GLOBAL.PLAYER_RADIUS);
      p5.text(players[socket.id].name, posX, posY);

      // Debug lines
      p5.text("x: " + Math.round(posX), posX, posY - 30);
      p5.text("y: " + Math.round(posY), posX, posY - 15);
      p5.text("ID: " + socket.id.substring(0, 6), posX, posY + 15);

      // End Transformations
      p5.pop();

      // Send coordinates
      socket.emit('move', { id: socket.id, x: posX, y: posY });
    }
    
  }

  // document.getElementById('').onclick = () => {
  //   canvas.focus();
  // }

}
export default game;