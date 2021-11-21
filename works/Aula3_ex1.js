/*
Matheus Franklin Rodrigues Silva

Class 3 Exercise 1:
Develop an environment that allows the navigation through manipulation of the camera position

*/
import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera, 
        initTrackballControls,
        SecondaryBox,
        initDefaultSpotlight,
        onWindowResize, 
        lightFollowingCamera,
        degreesToRadians} from "../libs/util/util.js";
import { createGroundPlaneWired } from '../../libs/util/util.js';
import KeyboardState from '../../libs/util/KeyboardState.js';

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var renderer = initRenderer();    // View function in util/utils

var keyboard = new KeyboardState();

//camera
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.lookAt(0, 0, 0);
camera.position.set(0.0, 0.0, 1.0);
camera.up.set(0, 1, 0);

//Camera Holder Object 
var cameraHolder = new THREE.Object3D();
cameraHolder.position.set(0.0,2.0,0.0);
cameraHolder.rotateY(degreesToRadians(45));
cameraHolder.add(camera);

scene.add(cameraHolder);


scene.add( new THREE.HemisphereLight());


var groundPlaneWired = createGroundPlaneWired(10, 10, 100, 100);
scene.add(groundPlaneWired);

function keyboardUpdate()
{
    keyboard.update();



    if(keyboard.pressed("left")) cameraHolder.rotateY(0.01);
    if(keyboard.pressed("right")) cameraHolder.rotateY(-0.01);
    if(keyboard.pressed("up"))  cameraHolder.rotateX(0.01);
    if(keyboard.pressed("down")) cameraHolder.rotateX(-0.01);
    if(keyboard.pressed(",")) cameraHolder.rotateZ(0.01);
    if(keyboard.pressed(".")) cameraHolder.rotateZ(-0.01);
    if(keyboard.pressed("space")) cameraHolder.translateZ(-0.5);

}


// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


render();
function render()
{
  stats.update(); // Update FPS
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}
