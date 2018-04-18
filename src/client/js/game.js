function Game() { };

Game.prototype.handleNetwork = function(socket) {
  console.log('Game connection process here');
  console.log(socket);
  
  // This is where you receive all socket messages
}

// Game.prototype.handleRoom = function(socket, roomName) {
//   console.log(socket);
//   socket.join(roomName, function() {
//     console.log(socket.id + ' joined room ' + roomName);
//   });
// }

Game.prototype.handleLogic = function() {
   //console.log('Game is running');
  // This is where you update your game logic
}

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
}

module.exports = Game;