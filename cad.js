import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { SUBTRACTION, ADDITION, Brush, Evaluator } from 'three-bvh-csg';

let stats;
let camera, scene, renderer;
let baseBrush, brush;
let result, evaluator, wireframe;

const params = {
  angle: 45,
  distance: 5,
  useGroups: true,
  wireframe: false,
};

init();

function init() {
  // environment
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100 );
  camera.position.set( 1, 1, 1 ).normalize().multiplyScalar( 10 );

  scene = new THREE.Scene();

  // lights
  const ambient = new THREE.HemisphereLight( 0xffffff, 0xbfd4d2, 3 );
  scene.add( ambient );

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.3 );
  directionalLight.position.set( 1, 4, 3 ).multiplyScalar( 3 );
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.setScalar( 2048 );
  directionalLight.shadow.bias = - 1e-4;
  directionalLight.shadow.normalBias = 1e-4;
  scene.add( directionalLight );

  // renderer
  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild( renderer.domElement );

  stats = new Stats();
  document.body.appendChild( stats.dom );

  // create brushes
  evaluator = new Evaluator();

  baseBrush = new Brush(
    new THREE.BoxGeometry( 4, 4, 4 ),
    new THREE.MeshStandardMaterial( {
      color: 0x99cc99,
      flatShading: true,
      polygonOffset: true,
      polygonOffsetUnits: 1,
      polygonOffsetFactor: 1,
    } ),
  );

  // TODO: Clone it with rotation
  brush = new Brush(
    new THREE.BoxGeometry( 10, 20, 20),
    new THREE.MeshStandardMaterial( {
      color: 0x80cbc4,
      polygonOffset: true,
      polygonOffsetUnits: 1,
      polygonOffsetFactor: 1,
    } ),
  );

  brush.visible = true; // (?)
  brush.position.x = 5;
  brush.position.y = 5;

  // brush.rotation.x = Math.PI/4; 
  // brush.rotation.y = Math.PI/4;
  brush.rotation.z = Math.PI/7;

  // create wireframe
  wireframe = new THREE.Mesh(
    undefined,
    new THREE.MeshBasicMaterial( { color: 0x777777, wireframe: true } ),
  );
  scene.add( wireframe );

  // controls
  const controls = new OrbitControls( camera, renderer.domElement );
  controls.minDistance = 5;
  controls.maxDistance = 75;

  // set up gui
  const gui = new GUI();
  gui.add( params, 'angle', 0, 90, 1 ).name( 'Angle' );
  gui.add( params, 'distance', 2, 7, 0.01 ).name( 'Distance' );
  gui.add( params, 'wireframe' );
  gui.add( params, 'useGroups' );

  // init helpers
  initHelpers();

  window.addEventListener( 'resize', onWindowResize );
  onWindowResize();
}

// Init helpers
function initHelpers() {
  // Axis
  let length = 4;
  let headLength = length * 0.1;
  let headWidth = headLength * 0.2;
  let o = new THREE.Vector3(0,0,0);
  let x = new THREE.Vector3(1,0,0);
  let y = new THREE.Vector3(0,1,0);
  let z = new THREE.Vector3(0,0,1);

  const axisX = new THREE.ArrowHelper(x, o, length, 'crimson', headLength, headWidth);
  const axisY = new THREE.ArrowHelper(y, o, length * 0.9,'green', headLength, headWidth);
  const axisZ = new THREE.ArrowHelper(z, o, length, 'royalblue', headLength, headWidth)
  scene.add( axisX );
  scene.add( axisY );
  scene.add( axisZ );

  // Grid
  /*
  const size = 5; 
  const divisions = 50; 
  const gridYZ = new THREE.GridHelper( size, divisions ).rotateZ(Math.PI/2);
  const gridXZ = new THREE.GridHelper( size, divisions );
  const gridXY = new THREE.GridHelper( size, divisions ).rotateX(Math.PI/2);
  scene.add( gridYZ );
  scene.add( gridXZ );
  scene.add( gridXY );
  */
}


function updateCSG() {
  evaluator.useGroups = params.useGroups;
  result = evaluator.evaluate( baseBrush, brush, SUBTRACTION, result );

  result.castShadow = true;
  result.receiveShadow = true;
  scene.add( result );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  // brush.position.x = params.distance;
  brush.position.y = params.distance;
  brush.rotation.z = THREE.MathUtils.degToRad(params.angle);
  // brush.rotation.y = Math.PI/4;
  brush.updateMatrixWorld();
  updateCSG();

  wireframe.geometry = result.geometry;
  wireframe.visible = params.wireframe;

  renderer.render( scene, camera );
  stats.update();
}