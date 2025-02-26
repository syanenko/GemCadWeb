import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';

let stats;
let camera, scene, renderer;
let baseBrush, brush;
let core;
let result, evaluator, wireframe;

const params = {
  useGroups: true,
  wireframe: false,
};

init();

function init() {
  // environment
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100 );
  camera.position.set( - 1, 1, 1 ).normalize().multiplyScalar( 10 );

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

  brush = new Brush(
    new THREE.CylinderGeometry( 1, 1, 5, 45 ),
    new THREE.MeshStandardMaterial( {
      color: 0x80cbc4,
      polygonOffset: true,
      polygonOffsetUnits: 1,
      polygonOffsetFactor: 1,

    } ),
  );

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
  gui.add( params, 'wireframe' );
  gui.add( params, 'useGroups' );

  window.addEventListener( 'resize', onWindowResize );
  onWindowResize();
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
  updateCSG();

  wireframe.geometry = result.geometry;
  wireframe.visible = params.wireframe;

  renderer.render( scene, camera );
  stats.update();
}