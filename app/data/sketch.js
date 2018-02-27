function setup() {
  createCanvas(1280, 720);
  frameRate(30);
  colorMode(HSB, 255);

}
var c = 0;

function draw() {
  ellipse(50, 50, 80, 80);
  if (c >= 255)  c=0;  else  c++;
  background(c, 255, 128);
}
