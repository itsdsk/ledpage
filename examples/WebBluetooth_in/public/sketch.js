var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.BoxGeometry();

var faceIndices = ["a", "b", "c"];
var vertexIndex, point;
geometry.faces.forEach(function (face) {
  // loop through faces
  for (var i = 0; i < 3; i++) {
    vertexIndex = face[faceIndices[i]]; // get the face's vertex's index
    point = geometry.vertices[vertexIndex]; // knowing the index, find the vertex in array of vertices
    color = new THREE.Color( // create a color
      point.x + 0.5, //apply xyz as rgb
      point.y + 0.5,
      point.z + 0.5
    );
    face.vertexColors[i] = color; //store the color in the face's vertexColors array
  }
});

var material = new THREE.MeshBasicMaterial({
  vertexColors: THREE.VertexColors,
});
var cube = new THREE.Mesh(geometry, material);
var quaternion = new THREE.Quaternion();

let cube_main = new THREE.Mesh(geometry, material);
scene.add(cube_main);

let cube_array = [];

/*
let cube_1 = new THREE.Mesh(geometry, material);
cube_1.position.y = 1; // up/down
cube_1.position.x = 0; // left/right
cube_1.position.z = -1; // forward/back
scene.add(cube_1);
*/

// layer 1
for (let i = 0; i < 3; i++) {
  let cube_n = new THREE.Mesh(geometry, material);
  let pos_angle = (i / 3) * (Math.PI * 2);
  pos_angle += Math.PI / 2;
  let pos_dist = 1.0;
  let pos_x = Math.sin(pos_angle) * pos_dist;
  let pos_y = Math.cos(pos_angle) * pos_dist;
  cube_n.position.y = pos_x; // up/down
  cube_n.position.x = pos_y; // left/right
  cube_n.position.z = -2; // forward/back
  cube_n.scale.x = 1.5;
  cube_n.scale.y = 1.5;
  cube_n.scale.z = 1.5;
  scene.add(cube_n);
  cube_array.push(cube_n);
}
// layer 2
for (let i = 0; i < 3; i++) {
  let cube_n = new THREE.Mesh(geometry, material);
  let pos_angle = (i / 3) * (Math.PI * 2);
  pos_angle += Math.PI * -0.5;
  let pos_dist = 1.25;
  let pos_x = Math.sin(pos_angle) * pos_dist;
  let pos_y = Math.cos(pos_angle) * pos_dist;
  cube_n.position.y = pos_x; // up/down
  cube_n.position.x = pos_y; // left/right
  cube_n.position.z = -4; // forward/back
  cube_n.scale.x = 2;
  cube_n.scale.y = 2;
  cube_n.scale.z = 2;
  scene.add(cube_n);
  cube_array.push(cube_n);
}

camera.position.z = 5;
function animate() {
  requestAnimationFrame(animate);

  quaternion.set(quatI, quatJ, quatK, quatReal);
  //quaternion = quaternion.conjugate();

  // quaternion.setFromAxisAngle( new THREE.Vector3( quatI, quatJ, quatK ).normalize(), quatReal );
  [cube_main, ...cube_array].forEach((cube_x) => {
    cube_x.rotation.x = 0;
    cube_x.rotation.y = 0;
    cube_x.rotation.z = 0;
    //cube.applyQuaternion( quaternion );
    cube_x.setRotationFromQuaternion(quaternion);
    //cube_x.rotation.x = performance.now() * 0.0003;
    //cube_x.rotation.y = performance.now() * 0.0003;
  });
  renderer.render(scene, camera);
}
animate();

var quatI = 0.0; // = myIMU.getQuatI();
var quatJ = 0.0; // = myIMU.getQuatJ();
var quatK = 0.0; // = myIMU.getQuatK();
var quatReal = 0.0; // = myIMU.getQuatReal();

function handleImuStatusChanged(event) {
  blee = decode(event.target.value); //.getUint8(0);
  var nums = blee.split(",");
  nums = nums.map(parseFloat);
  //console.log(JSON.stringify(nums));
  quatI = nums[0];
  quatJ = nums[1];
  quatK = nums[2];
  quatReal = nums[3];
}

/* Disconnect from peripheral and update UI */
function disconnect() {
  balenaBLE.disconnect();
}

var balenaBLE = new BalenaBLE();
//document.addEventListener('mouseenter', userGestureEvent, false);
document.addEventListener("click", userGestureEvent, false);

async function userGestureEvent(event) {
  try {
    await balenaBLE.request();
  } catch (error) {
    console.log("request error: " + error.message);
  }
  try {
    await balenaBLE.connect();
  } catch (error) {
    console.log("connect error: " + error.message);
  }
  try {
    await balenaBLE.setImuCharacteristic();
  } catch (error) {
    console.log("set characterstic error: " + error.message);
  }
}

/* helper function to decode message sent from peripheral */
function decode(buf) {
  let dec = new TextDecoder("utf-8");
  return dec.decode(buf);
}
