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
    p5.frameRate(GLOBAL.FRAME_RATE);
    
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
    
    // Shorthand for referencing player
    let player = players[socket.id];

    // X and Y components of theta, value equal to -1 or 1 depending on direction
    let xDir = 0, yDir = 0;

    // Make sure player is not in chat before checking move
    if (document.activeElement !== document.getElementById('chatInput')) {
      if(players !== undefined && player !== undefined) {
        player.move(p5);
        // Send coordinates
        socket.emit('move', { id: socket.id, x: player.x, y: player.y, theta: player.theta, speed: player.speed });
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
    if(player !== undefined)
      p5.translate(-player.x, -player.y);


    // Draw grid
    p5.stroke(70);
    p5.strokeWeight(1);

    if(player !== undefined) {
      for (let x = player.x - GLOBAL.SPAWN_RADIUS; x < player.x + GLOBAL.SPAWN_RADIUS; x += GLOBAL.GRID_SPACING) {
        for (let y = player.y - GLOBAL.SPAWN_RADIUS; y < player.y + GLOBAL.SPAWN_RADIUS; y += GLOBAL.GRID_SPACING) {
          p5.line(x - (x % GLOBAL.GRID_SPACING), player.y - GLOBAL.SPAWN_RADIUS, x - (x % GLOBAL.GRID_SPACING), player.y + GLOBAL.SPAWN_RADIUS);
          p5.line(player.x - GLOBAL.SPAWN_RADIUS, y - (y % GLOBAL.GRID_SPACING), player.x + GLOBAL.SPAWN_RADIUS, y - (y % GLOBAL.GRID_SPACING));
        }
      }
    }

    p5.strokeWeight(0);

    // Draw powerups

    for(let powerup of powerups) {
      if(distanceBetween(player, powerup) < GLOBAL.SPAWN_RADIUS) {
        powerup.draw(p5);
  
        // Check powerup collision
        if(powerup.checkCollision(player))
          socket.emit('powerupChange', {index: powerup.index});
      }
    }

    // Draw other players
    for (let player in players) {
      if(distanceBetween(player, player) < GLOBAL.SPAWN_RADIUS) {
        let pl = players[player];

        if (pl !== null && pl.id !== socket.id)
          pl.draw(false, p5);
      }
    }

    // Draw player in the center of the screen
    if (socket.id !== undefined && players !== undefined && player !== undefined) {
      player.draw(true, p5);
    }

    // End Transformations
    p5.pop();

  }
  
}
export default game;