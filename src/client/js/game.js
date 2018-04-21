var playerX = window.innerWidth / 2;
var playerY = window.innerHeight / 2;
var playerRadius = 100;

var playerSpeed = 5;

function setup() {
  var canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.parent('gameAreaWrapper');
  background(color(0, 255, 0));
  
}

var moveX = 0.0;
var moveY = 0.0;

function draw() {
  // push();
  // translate(window.innerWidth / 2, window.innerHeight / 2);
  var shouldIncrement = false;

  var mouseXC = mouseX - window.innerWidth / 2;
  var mouseYC = mouseY - window.innerHeight / 2;

  var theta = Math.atan2(mouseYC, mouseXC);

  var move = Math.sqrt(Math.pow(mouseXC, 2) + Math.pow(mouseYC, 2)) > playerRadius;

  if(move) {
    moveX += Math.cos(theta) * playerSpeed;
    moveY += Math.sin(theta) * playerSpeed;
  }

  // console.log(stepX, stepY);

  clear();
  push();
  translate(-moveX, -moveY);
  ellipse(200, 200, 30, 30);
  ellipse(400, 400, 30, 30);
  ellipse(600, 600, 30, 30);
  ellipse(800, 800, 30, 30);
  pop();
  ellipse(playerX, playerY, 2*playerRadius, 2*playerRadius);
}

