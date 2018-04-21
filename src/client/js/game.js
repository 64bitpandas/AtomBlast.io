var playerX = window.innerWidth / 2;
var playerY = window.innerHeight / 2;
var playerRadius = 100;

var playerSpeed = 2;

function setup() {
  var canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.parent('gameAreaWrapper');
  background(color(0, 255, 0));
  
}

var stepX = 0;
var stepY = 0;

function draw() {
  // push();
  // translate(window.innerWidth / 2, window.innerHeight / 2);
  var shouldIncrement = false;
  var stepX = 0;
  var stepY = 0;

  var mouseXC = mouseX - window.innerWidth / 2;
  var mouseYC = mouseY - window.innerHeight / 2;

  var theta = Math.atan2(mouseYC, mouseXC);

  var move = Math.sqrt(Math.pow(mouseXC, 2) + Math.pow(mouseYC, 2)) > playerRadius;

  if(move) {
    stepX += Math.cos(theta) * playerSpeed;
    stepY += Math.sin(theta) * playerSpeed;
  }

  console.log(mouseXC + ", " + mouseYC);

  clear();
  ellipse(playerX, playerY, 2*playerRadius, 2*playerRadius);
  push();
  if(move)
    translate(stepX, stepY);
  ellipse(20, 20, 300, 300);
  ellipse(40, 40, 300, 300);
  ellipse(60, 60, 300, 300);
  ellipse(80, 80, 300, 300);
  pop();
}

