import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer,
        InfoBox,
        SecondaryBox, 
        initCamera,
        initDefaultBasicLight,
      degreesToRadians} from "../libs/util/util.js";

import {finishLap, LapInfo, Stopwatch, Speedway} from './enviroment.js';
import { createCar, createRoda, isOnTheSpeedway} from './car.js';
    

var stats = new Stats();          // To show FPS information
var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(0, -30, 15)); // Init camera in this position


// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// To use the keyboard
var keyboard = new KeyboardState();

// Show text information onscreen
//showInformation();

// Show axes (parameter is size of each axis)
//var axesHelper = new THREE.AxesHelper( 12 );
//scene.add( axesHelper );

//Light
initDefaultBasicLight(scene, true);

//Create the ground plane
var planeGeometry = new THREE.PlaneGeometry(500, 500);
//planeGeometry.translate(0.0, 0.0, -0.02); // To avoid conflict with the axeshelper
var planeMaterial = new THREE.MeshBasicMaterial({
    color: "rgba(0, 0, 255)",
    side: THREE.DoubleSide,
});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

//Create Speedway
var speedway = new Speedway(21, 1);
speedway.blocks.forEach(function(block) {
  scene.add(block.block); //Adiciona na cena cada cube do array de blocos 
  scene.add(block.fundo); //Adiciona na cena o fundo de cada cube do array de blocos 
})

/*
var tamPista = 21;

var track = createTrack1(tamPista); //Retorna um array de blocos

track.forEach(function(block){
    scene.add(block.block); //Adiciona na cena cada cube do array de blocos 
    scene.add(block.fundo); //Adiciona na cena o fundo de cada cube do array de blocos 
})*/

//Create car

var group = createCar();
scene.add(group);
var roda1 = createRoda();
roda1.position.set( 3.5, -1.0, 4.0);
var roda2 = createRoda();
roda2.position.set( -3.5, -1.0, 4.0);
group.add(roda1);
group.add(roda2);
group.scale.set(0.5,0.5,0.5);
// Move all to the start position
group.translateY(-(speedway.sideSize*10)/2);
group.translateZ(4);
group.rotateY(degreesToRadians(-90));
group.rotateZ(degreesToRadians(-90))

//Create Stopwatch
var stopwatch = new Stopwatch();


//Move

function keyboardUpdate() {

  keyboard.update();

  if ( keyboard.pressed("up") )    group.translateZ(  1 );
  if ( keyboard.pressed("down") )  group.translateZ( -1 );

  var angle = degreesToRadians(10);
  if ( keyboard.pressed(",") )  group.rotateY(  angle );
  if ( keyboard.pressed(".") ) group.rotateY( -angle );

  if ( keyboard.pressed("left") ){
    //axis1.rotateX( angle );
    roda1.rotateY( angle);
    roda2.rotateY( angle);
  }
  if ( keyboard.pressed("right") ){
   //axis1.rotateX( -angle );
   roda1.rotateY( -angle);
   roda2.rotateY( -angle);
  }

  //Cronometro
  if(keyboard.down("down")) stopwatch.pause();
  if(keyboard.down("up")) stopwatch.start();
  if(keyboard.down("left")) stopwatch.stop();
  
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

function cameraFollow()
{
    var objectToFollow = group;
    var dirX = Math.sin(group.rotation.y);
    var offset = new THREE.Vector3(objectToFollow.position.x + 80 + dirX*10, 80, objectToFollow.position.z + 80);
            
    camera.position.lerp(offset, 0.2);
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

STOP

render();
function render()
{
  stats.update(); // Update FPS
  trackballControls.update(); // Enable mouse movements
  keyboardUpdate();
  updateLapInfo();
  console.log(isOnTheSpeedway(group, speedway));
  //console.log(finishLap(track));
  //cameraFollow();
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}