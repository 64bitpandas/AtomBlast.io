/// <reference path="./lib/p5.global-mode.d.ts" />
import { p5 } from './lib/p5.min.js';
import { GLOBAL } from './global.js';
import { players, socket, powerups, showElement, hideElement, distanceBetween } from './app.js';
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
    p5.noStroke(); // Removes stroke on objects

    socket.on('disconnect', () => {
      p5.remove();
    })
  }

  p5.windowResized = () => {
      p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
      console.log('resize');
  }

  // P5 Key Listener
  p5.keyPressed = () => {
    if (p5.keyCode === p5.ESCAPE) {
      if (document.getElementById('menubox').offsetParent === null)
        showElement('menubox');
      else
        hideElement('menubox');

    }
  }

  // Processing.js Draw Loop
  p5.draw = () => {
    // const mouseXC = p5.mouseX - window.innerWidth / 2;
    // const mouseYC = p5.mouseY - window.innerHeight / 2;

    // // If the mouse is outside of the player onscreen (boolean)
    // const move = Math.sqrt(mouseXC ** 2 + mouseYC ** 2) > GLOBAL.PLAYER_RADIUS;

    // // Set speed and direction
    // if (move && p5.mouseIsPressed) {
    //   playerSpeed = GLOBAL.MAX_SPEED;
    //   theta = Math.atan2(mouseYC, mouseXC);
    // }

    // X and Y components of theta, value equal to -1 or 1 depending on direction
    let xDir = 0, yDir = 0;

    // Make sure player is not in chat before checking move
    if (document.activeElement !== document.getElementById('chatInput')) {
      if(players !== undefined && players[socket.id] !== undefined) {
        players[socket.id].move(p5);
        // Send coordinates
        socket.emit('move', { id: socket.id, x: players[socket.id].x, y: players[socket.id].y, theta: players[socket.id].theta, speed: players[socket.id].speed });
      }
    }

    // Clears the frame
    p5.clear();

    // Draw background - bright pink in the center, black at the edges
    p5.background(p5.lerpColor(p5.color(229, 46, 106), p5.color(0, 0, 0), posX / GLOBAL.MAP_SIZE));

    // Start Transformations
    p5.push();

    // Translate coordinate space
    p5.translate(window.innerWidth / 2, window.innerHeight / 2);
    if(players[socket.id] !== undefined)
    p5.translate(-players[socket.id].x, -players[socket.id].y);

    // Draw powerups

    for(let powerup of powerups) {
      if(distanceBetween(players[socket.id], powerup) < GLOBAL.SPAWN_RADIUS) {
        powerup.draw(p5);
  
        // Check powerup collision
        if(powerup.checkCollision(players[socket.id]))
          socket.emit('powerupChange', {index: powerup.index});
      }
    }

    // Draw other players
    for (let player in players) {
      if(distanceBetween(players[socket.id], player) < GLOBAL.SPAWN_RADIUS) {
        let pl = players[player];

        if (pl !== null && pl.id !== socket.id)
          pl.draw(false, p5);
      }
    }

    // Draw player in the center of the screen
    if (socket.id !== undefined && players !== undefined && players[socket.id] !== undefined) {
      players[socket.id].draw(true, p5);
    }

    // End Transformations
    p5.pop();

  }
  
}
export default game;