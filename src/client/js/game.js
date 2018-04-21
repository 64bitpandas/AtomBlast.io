
var playerX = window.innerWidth / 2;
var playerY = window.innerHeight / 2;
var playerRadius = 100;
var moveVelocity = 5;

function setup() {
  var canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.parent('gameAreaWrapper');
  background(color(0, 255, 0));
  
}

function draw() {
  var stepX;
  var stepY;

  clear();
  ellipse(playerX, playerY, 2*playerRadius, 2*playerRadius);

  push();
  translate(stepX, stepY);
  ellipse(20, 20, 30, 30);
  ellipse(40, 40, 30, 30);
  ellipse(60, 60, 30, 30);
  ellipse(80, 80, 30, 30);
  pop();
}

