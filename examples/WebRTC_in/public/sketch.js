// log performance
var log_perf = false;
var lastTime;
var logPeriod = 300;

var isPi = false;
var peer;

let videoElement = document.querySelector("video");
let constraints = {
  video: true,
  audio: false,
};

var irisR, pupilR;
var irisColour;

function setup() {
  // centre on page
  var cnv = createCanvas(windowWidth, windowHeight);
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);
  // log perf
  if (log_perf) lastTime = millis();
  //
  textAlign(LEFT);
  noStroke();
  var eyeballR = width * 1.1;
  irisR = (11.5 / 23) * eyeballR;
  pupilR = irisR * 0.33;
  var irisLightness = 0.2;
  irisColour = color(
    101 * irisLightness,
    67 * irisLightness,
    33 * irisLightness
  );
}
var lastX = 0;
var lastY = 0;

function easeOutQuad(valIn) {
  var valOut = 1 - pow(1 - abs(valIn), 2);
  if (valIn < 0) valOut *= -1;
  return valOut;
}
function draw() {
  translate(width / 2, height / 2);
  background(255);
  fill(255);
  var res = 20;
  var amp = min(height, width * 0.25);
  if (livePoint != undefined && "x" in livePoint) {
    var lerpAmt = 0.2;
    // move eyes closer to angle using easeOutQuad
    var livePointX = easeOutQuad(livePoint.x);
    var livePointY = easeOutQuad(livePoint.y);
    // fix aspect ratio
    livePointY *= livePoint.a;
    // set eye position
    lastX = lerp(lastX, livePointX * (width / 2), lerpAmt);
    lastY = lerp(lastY, livePointY * (height / 2), lerpAmt);
    // clamp eye direction
    var maxY = sin(((lastX + width / 2) / width) * PI) * amp;
    if (abs(lastY) > maxY) {
      lastY = lastY > 0 ? maxY : -maxY;
    }
  }
  // iris
  fill(irisColour);
  circle(lastX, lastY / 2, irisR);
  fill(0);
  circle(lastX, lastY / 2, pupilR);
  // top of eye
  fill(0);
  beginShape();
  vertex(-width / 2, -height / 2);
  for (var i = 0; i <= res; i++) {
    vertex((i / res) * width - width / 2, sin((i / res) * PI) * -amp);
  }
  vertex(width / 2, -height / 2);
  endShape();
  beginShape();
  vertex(-width / 2, height / 2);
  // bottom of eye
  for (var i = 0; i <= res; i++) {
    vertex((i / res) * width - width / 2, sin((i / res) * PI) * amp);
  }
  vertex(width / 2, height / 2);
  endShape();
}

let detector, poses;
let connection;
let livePoint; // {x,y} where x and y are from -1 to 1

// detect if screen size is small, if so assume this is running on the pi
isPi = window.innerHeight < 300;

if (isPi) {
  console.log("Detected this device as Pi, listening for peer");
  peer = new Peer("peer_test_from_p5_editor");
  // data connection
  peer.on("connection", (conn) => {
    conn.on("data", (data) => {
      livePoint = data;
    });
    conn.on("open", () => {
      console.log("Connected to peer");
    });
  });
} else {
  peer = new Peer();
  console.log("Detected this device as laptop, opening webcam");
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("Webcam ready");
  }
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      console.log("Connected to webcam");
      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = async function (e) {
        videoElement.play();
        console.log("Started video stream");
        // connect to peer
        connection = peer.connect("peer_test_from_p5_editor");
        connection.on("open", () => {
          console.log("Connected to peer");
        });
        // create detector
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet
        );
        async function runDetector() {
          // pass video to detector
          poses = await detector.estimatePoses(videoElement);
          // extract keypoint
          if (
            poses != undefined &&
            poses.length > 0 &&
            poses[0].keypoints[0].score > 0.3
          ) {
            var x = -round(
              2 * (poses[0].keypoints[0].x / videoElement.videoWidth - 0.5),
              2
            );
            var y = round(
              2 * (poses[0].keypoints[0].y / videoElement.videoHeight - 0.5),
              2
            );
            // fix aspect ratio
            var aspectRatio =
              videoElement.videoHeight / videoElement.videoWidth;
            livePoint = { x: x, y: y, a: aspectRatio };
          } else {
            livePoint = {};
          }
          if (connection != undefined && connection.open) {
            connection.send(livePoint);
          }
          // repeat next frame
          requestAnimationFrame(runDetector);
        }
        runDetector();
      };
      console.log("created capture from webcam " + stream);
    })
    .catch((err) => {
      console.log("error: failed to get local stream");
    });
}
