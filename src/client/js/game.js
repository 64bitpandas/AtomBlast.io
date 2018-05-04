const playerX = window.innerWidth / 2;
const playerY = window.innerHeight / 2;
const playerRadius = 100;

const playerSpeed = 5;

function setup() {
  const canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.parent('gameAreaWrapper');
  background(color(0, 255, 0));

}

let moveX = 0.0;
let moveY = 0.0;

function draw() {
  // push();
  // translate(window.innerWidth / 2, window.innerHeight / 2);
  const shouldIncrement = false;

  const mouseXC = mouseX - window.innerWidth / 2;
  const mouseYC = mouseY - window.innerHeight / 2;

  const theta = Math.atan2(mouseYC, mouseXC);

  const move = Math.sqrt(mouseXC ** 2 + mouseYC ** 2) > playerRadius;

  if (move) {
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
  ellipse(playerX, playerY, 2 * playerRadius, 2 * playerRadius);
}
