
function setup() {
  var canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('gameAreaWrapper');
}

function draw() {

  ellipse(mouseX, mouseY, 30, 30);

}