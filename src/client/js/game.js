function Game() { }
var isFirstRun = true; // True for first time handleLogic() is run



Game.prototype.handleNetwork = function(socket) {
  console.log('Game connection process here');
  console.log(socket);
  
  // This is where you receive all socket messages
};

Game.prototype.handleLogic = function() {
   if(isFirstRun) {
     console.info('Game is running - handleLogic() function is running! ' + 
      'This method will loop. Further message suppressed.');
     isFirstRun = false;
   }
  // This is where you update your game logic
};

Game.prototype.handleGraphics = function(gfx, roomName) {
  // This is where you draw everything
  var width = document.body.clientWidth, height = document.body.clientHeight;

  gfx.fillStyle = '#fbfcfc';
  gfx.fillRect(0, 0, width, height);

  gfx.fillStyle = '#2ecc71';
  gfx.strokeStyle = '#27ae60';
  gfx.font = 'bold 50px Verdana';
  gfx.textAlign = 'center';
  gfx.lineWidth = 2;
  gfx.fillText('Now playing in room ' + roomName, width / 2, height / 2);
  gfx.strokeText('Now playing in room ' + roomName, width / 2, height / 2);

  drawCircle(100, 100, 50, 100, gfx);
  gfx.fillText('Here Is A Circle', 250, 50);
  drawCircle(250, 100, 50, 10, gfx);
  drawCircle(400, 100, 50, 4, gfx);
  drawCircle(550, 100, 50, 3, gfx);
};

function drawCircle(centerX, centerY, radius, sides, gfx) {
    var theta = 0;
    var x = 0;
    var y = 0;

    gfx.beginPath();

    for (var i = 0; i < sides; i++) {
        theta = (i / sides) * 2 * Math.PI;
        x = centerX + radius * Math.sin(theta);
        y = centerY + radius * Math.cos(theta);
        gfx.lineTo(x, y);
    }

    gfx.closePath();
    gfx.stroke();
    gfx.fill();
}

module.exports = Game;