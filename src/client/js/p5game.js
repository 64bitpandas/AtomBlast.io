/// <reference path="./lib/p5.global-mode.d.ts" />
import { p5 } from './lib/p5.min.js';
import { GLOBAL } from './global.js';
import { players, socket, showElement, hideElement } from './app.js';
// Please comment YOUR CODE! <---- yes PLEASE !

const game = (p5) => {
  let playerSpeed = GLOBAL.MAX_SPEED;
  // dx & dy
  let posX = 0.0;
  let posY = 0.0;
  let theta = 0.0;

  // Processing.js Setup Function
  p5.setup = () => {
    let canvas = p5.createCanvas(window.innerWidth, window.innerHeight); // Creates a Processing.js canvas
    canvas.parent('gameAreaWrapper'); // Makes the canvas a child component of the gameAreaWrapper div tag 
    p5.background(p5.color(0, 255, 0)); // background color will be green
    p5.noStroke(); // Removes stroke on objects

    socket.on('disconnect', () => {
      p5.remove();
    })
  }

  // P5 Key Listener
  p5.keyPressed = () => {
    if(p5.keyCode === p5.ESCAPE) {
      if(document.getElementById('menubox').offsetParent === null)
        showElement('menubox');
      else
        hideElement('menubox');

    }
  }

  // Processing.js Draw Loop
  p5.draw = () => {

    const mouseXC = p5.mouseX - window.innerWidth / 2;
    const mouseYC = p5.mouseY - window.innerHeight / 2;

    // // If the mouse is outside of the player onscreen (boolean)
    // const move = Math.sqrt(mouseXC ** 2 + mouseYC ** 2) > GLOBAL.PLAYER_RADIUS;

    // // Set speed and direction
    // if (move && p5.mouseIsPressed) {
    //   playerSpeed = GLOBAL.MAX_SPEED;
    //   theta = Math.atan2(mouseYC, mouseXC);
    // }

    // X and Y components of theta, value equal to -1 or 1 depending on direction
    let xDir = 0, yDir = 0;

    // W (up)
    if (p5.keyIsDown(GLOBAL.KEY_W)) {
      playerSpeed = GLOBAL.MAX_SPEED;
      yDir = 1;
    }
    // A (left)
    if (p5.keyIsDown(GLOBAL.KEY_A)) {
      playerSpeed = GLOBAL.MAX_SPEED;
      xDir = -1;
    }
    // S (down)
    if (p5.keyIsDown(GLOBAL.KEY_S)) {
      yDir = -1;
      playerSpeed = GLOBAL.MAX_SPEED;
    }
    // D (right)
    if (p5.keyIsDown(GLOBAL.KEY_D)) {
      xDir = 1;
      playerSpeed = GLOBAL.MAX_SPEED;
    }

    // Set direction- if no keys pressed, retains previous direction
    if (yDir !== 0 || xDir !== 0) {
      theta = Math.atan2(-yDir, xDir);
    }
    // Reduce speed (inertia)
    else if (playerSpeed > 0)
      playerSpeed -= GLOBAL.VELOCITY_STEP;

    // Prevent drifting due to minimal negative values
    if (playerSpeed < 0)
      playerSpeed = 0;

    // Change position based on speed and direction
    posX += Math.cos(theta) * playerSpeed;
    posY += Math.sin(theta) * playerSpeed;

    // Clears the frame
    p5.clear();

    // Send coordinates
    socket.emit('move', { id: socket.id, x: posX, y: posY, theta: theta, speed: playerSpeed });

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

    // Draw other players
    for (let player in players) {
      let pl = players[player];

      if (pl !== null && pl.id !== socket.id)
        drawPlayer(p5, pl, false);
    }

    // Draw player in the center of the screen
    if (socket.id !== undefined && players !== undefined && players[socket.id] !== undefined)
      drawPlayer(p5, {
        id: socket.id,
        name: players[socket.id].name,
        x: posX,
        y: posY
      }, true);

    // End Transformations
    p5.pop();

  }
}
export default game;

/**
 * Draws all components of a given player, including all powerups and atoms held.
 * @param {any} p5 The p5 renderer reference
 * @param {any} player Player object containing all playerdata. See `server.js` for a detailed list of required fields
 * @param {boolean} isThisPlayer True if the player to be drawn is owned by this client.
 */
function drawPlayer(p5, player, isThisPlayer) {

  // Predict positions of other player
  if(!isThisPlayer) {
    player.x += Math.cos(player.theta) * player.speed;
    player.y += Math.sin(player.theta) * player.speed;
  }

  // Draw player
  p5.ellipse(player.x, player.y, 2 * GLOBAL.PLAYER_RADIUS);
  p5.text(player.name, player.x, player.y);

  // Debug lines
  p5.text("x: " + Math.round(player.x), player.x, player.y - 30);
  p5.text("y: " + Math.round(player.y), player.x, player.y - 15);
  p5.text("ID: " + player.id.substring(0, 6), player.x, player.y + 15);
}