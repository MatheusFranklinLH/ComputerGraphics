import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer,
        InfoBox, 
        initCamera,
        initDefaultBasicLight,
        createGroundPlaneWired,
      degreesToRadians} from "../libs/util/util.js";

import {LapInfo, Stopwatch, Speedway} from './enviroment.js';
import { Car} from './car.js';
    

var stats = new Stats();          // To show FPS information
var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
renderer.setClearColor("rgb(30, 30, 40)");
//var camera = initCamera(new THREE.Vector3(0, -30, 15)); // Init camera in this position


// Enable mouse rotation, pan, zoom etc.
//var trackballControls = new TrackballControls( camera, renderer.domElement );

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(0,80,80);
  camera.up.set( 0, 1, 0);
var TrackballCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  TrackballCamera.lookAt(0, 0, 0);
  TrackballCamera.position.set(0,80,80);
  TrackballCamera.up.set( 0, 1, 0 );

scene.add(camera);
scene.add(TrackballCamera);

var trackballControls = new TrackballControls( TrackballCamera, renderer.domElement );

var cameraFree = false;

window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
window.addEventListener( 'resize', function(){onWindowResize(TrackballCamera, renderer)}, false );

// To use the keyboard
var keyboard = new KeyboardState();

// Show text information onscreen
//showInformation();

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

//Light
initDefaultBasicLight(scene, true);

//Create the ground plane
/*
var planeGeometry = new THREE.PlaneGeometry(500, 500);
planeGeometry.translate(-0.02, -0.02, -0.02); // To avoid conflict with the axeshelper
var planeMaterial = new THREE.MeshBasicMaterial({
    color: "rgba(0, 0, 255)",
    side: THREE.DoubleSide,
});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, 0);
plane.rotateX(degreesToRadians(-90));
scene.add(plane);
*/
var plane = createGroundPlaneWired(600, 600, 50, 50); // width and height
scene.add(plane);

//Create Speedway
var speedway = new Speedway(21, 1);
speedway.blocks.forEach(function(block) {
  scene.add(block.block); //Adiciona na cena cada cube do array de blocos 
  scene.add(block.fundo); //Adiciona na cena o fundo de cada cube do array de blocos 
})

//Create car
var car = new Car(1)
scene.add(car.group);
car.placeInitialPosition(speedway.sideSize);
car.group.scale.set(0.2, 0.2, 0.2);
car.updateNumCorners(speedway);

camera.position.set(car.group.position.x ,car.group.position.y + 80,80);

//Create Stopwatch
var stopwatch = new Stopwatch();


//Move

function keyboardUpdate() {

  keyboard.update();

  if ( keyboard.pressed("up") )    car.group.translateZ(  1 );
  if ( keyboard.pressed("down") )  car.group.translateZ( -1 );

  var angle = degreesToRadians(10);
  if ( keyboard.pressed(",") )  car.group.rotateY(  angle );
  if ( keyboard.pressed(".") ) car.group.rotateY( -angle );

  if ( keyboard.pressed("left") ){
    car.roda1.rotateY( angle);
    car.roda2.rotateY( angle);
  }
  if ( keyboard.pressed("right") ){
   car.roda1.rotateY( -angle);
   car.roda2.rotateY( -angle);
  }

  //Cronometro
  if(keyboard.down("P")) stopwatch.pause();
  if(keyboard.down("I")) stopwatch.start();
  if(keyboard.down("O")) stopwatch.stop();
  
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Car Model");
    controls.addParagraph();
    controls.add("Use mouse to rotate/pan/zoom the camera");
    controls.add("Up / Back arrow to walk");
    controls.add("Left / Right arrow to turn the wheels");
    controls.add("Press ',' and '.' to rotate in place")
    controls.show();
}

//Camera

function cameraControl()
{
  changeCamera();
  
  if (cameraFree)
    trackballControls.update();
  else
    cameraFollow();
}

function changeCamera()
{
  if ( keyboard.down("space") )
  {
    // Troca de camera
    cameraFree = !cameraFree;
    setupCamera();
  }
}

function setupCamera()
{
  
  if (!cameraFree)
    {
      // Quando desativado o trackball
      // Ativar outros objetos a serem visíveis
      speedway.blocks.forEach(function(block){
        block.cube.visible = true;
        block.cubeFundo.visible = true;
      })
      plane.visible = true;
    
    }
    else 
    {
      // Quando ativado o trackball
      // Arrumar Posicao
      trackballControls.reset;
      trackballControls.target.set( car.group.position.x, car.group.position.y, car.group.position.z );
      TrackballCamera.up.set( 0,1,0 );
      TrackballCamera.position.set(car.group.position.x + 80, 80, car.group.position.z + 80);
      TrackballCamera.lookAt(car.group.position);
      
      // Desativar visibilidade de outros objetos
      speedway.blocks.forEach(function(block){
        block.cube.visible = false;
        block.cubeFundo.visible = false;
      })

      plane.visible = false;
    }
}

function cameraFollow()
{
  var objectToFollow = car.group;
  var dir = new THREE.Vector3();
  car.group.getWorldDirection(dir);
  camera.position.set(objectToFollow.position.x + dir.x*10, 80, objectToFollow.position.z + 80 + dir.z*10);
  camera.lookAt(objectToFollow.position.x + dir.x*10, 0, objectToFollow.position.z +dir.z*10);
}

function cameraRenderer ()
{
  if (cameraFree)
    renderer.render(scene, TrackballCamera);
  else
    renderer.render(scene, camera);
}


//Laps Info
var stopwatchInfo = new LapInfo();
function updateLapInfo() {
  stopwatchInfo.changeStopwatch(stopwatch.format);
  stopwatchInfo.changeFirstLap("1º Lap: 00:00:00");
  stopwatchInfo.changeSecLap("2º Lap: 00:00:00");
  stopwatchInfo.changeThirdLap("3º Lap: 00:00:00");
  stopwatchInfo.changeFourthLap("4º Lap: 00:00:00");
}


render();
function render()
{
  stats.update(); // Update FPS
  //trackballControls.update(); // Enable mouse movements
  keyboardUpdate();
  updateLapInfo();
  console.log(car.isOnTheSpeedway(speedway));
  car.movement(speedway);
  //console.log(car.lap);
  cameraControl();
  requestAnimationFrame(render);
  cameraRenderer(); // Render scene 
}