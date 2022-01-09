import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import { Cybertruck } from       './cybertruck.js';
import {ConvexGeometry} from '../build/jsm/geometries/ConvexGeometry.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer,
      InfoBox,
      degreesToRadians} from "../libs/util/util.js";

import {LapInfo, Stopwatch, Speedway, gameInfo} from './enviroment.js';
    


var stats = new Stats();          // To show FPS information
var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
renderer.setClearColor("rgb(30, 30, 40)");

//Stopwatch flags
var startStopwatchFlag = true; // Flag que inicia o cronômetro quando seta para cima é apertado no inicio do jogo
var firstLapFlag = true; //Flag para atualização da primeira volta
var secLapFlag = true; //Flag para atualização da segunda volta
var thirdLapFlag = true; //Flag para atualização da terceira volta
var fourthLapFlag = true; //Flag para atualização da quarta volta

//Create Stopwatches
var stopwatch = new Stopwatch();
var swLaps = new Stopwatch(); 

//Laps Info
var stopwatchInfo = new LapInfo();
var bestM = 61;
var bestS = 61;

var gameIsOnFlag = true; //Flag para mostrar as informações das voltas após o termino do jogo

var lapTimes = []; //Array que guarda o tempo de cada volta em string

//Speedway infos:
var speedway;
var swCornersX;
var swCornersZ;
var swInitx;
var swInitz;
var blockSize;


var camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 1000); //Camera principal
  camera.lookAt(0, 0, 0);
  camera.position.set(0,80,80);
  camera.up.set( 0, 1, 0);
var TrackballCamera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 1000); //Trackball
  TrackballCamera.lookAt(0, 0, 0);
  TrackballCamera.position.set(30,5,50);
  TrackballCamera.up.set( 0, 1, 0 );

var vcWidth = 200; 
var vcHeidth = 200; 
var s = 75; // Estimated size for orthographic projection
var map = new THREE.OrthographicCamera(-500, 500,
                        500, -500, 1, s);
map.position.set (0,20,0);
map.up.set(0,1,0); 
map.lookAt(0,0,0);
scene.add(map);
scene.add(camera);
scene.add(TrackballCamera);

var trackballControls = new TrackballControls( TrackballCamera, renderer.domElement );

var cameraFree = false; //Flack que ativa o modo de inspeção

window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
window.addEventListener( 'resize', function(){onWindowResize(TrackballCamera, renderer)}, false );
export function onWindowResize(camera, renderer){

  if (camera instanceof THREE.PerspectiveCamera)
  {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  else {
    // TODO for other cameras
  }
}
// spotlight
var spotlight = new THREE.SpotLight( "white",0,0,Math.PI/8,0.5)
spotlight.visible = false;
spotlight.castShadow = true;
spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;
spotlight.shadow.camera.near = 10;
spotlight.shadow.camera.far = 300;
spotlight.shadow.camera.fov = 20;
spotlight.intensity = 1;
scene.add(spotlight);

//Light
var directionalLight = directional(scene, true);
directionalLight.visible = true;

function directional(scene, castShadow = false, position = new THREE.Vector3(80, 80, 80), 
                                      shadowSide = 128, shadowMapSize = 1024, shadowNear = 0.1, shadowFar = 500 ) 
{
  //let position = (initialPosition !== undefined) ? initialPosition : new THREE.Vector3(1, 1, 1);

  const ambientLight = new THREE.HemisphereLight(
    'white', // bright sky color
    'darkslategrey', // dim ground color
    0.25, // intensity
  );

  const mainLight = new THREE.DirectionalLight('white', 1.3);
    mainLight.position.copy(position);
    mainLight.castShadow = castShadow;

  // Directional ligth's shadow uses an OrthographicCamera to set shadow parameteres
  // and its left, right, bottom, top, near and far parameters are, respectively,
  // (-5, 5, -5, 5, 0.5, 500).    
  const shadow = mainLight.shadow;
    shadow.mapSize.width  =  shadowMapSize; 
    shadow.mapSize.height =  shadowMapSize; 
    shadow.camera.near    =  shadowNear;
    shadow.camera.far     =  shadowFar; 
    shadow.camera.left    = -shadowSide/2; 
    shadow.camera.right   =  shadowSide/2; 
    shadow.camera.bottom  = -shadowSide/2; 
    shadow.camera.top     =  shadowSide/2; 

  scene.add(ambientLight);
  scene.add(mainLight);

  return mainLight;
}

// To use the keyboard
var keyboard = new KeyboardState();

// Car
var cybertruck;
var objectToFollow;
var massVehicle = 600;
var friction = 3000;
var suspensionStiffness = 20.0;
var suspensionDamping = 8.3;
var suspensionCompression = 3.3;
var suspensionRestLength = 0.1;
var rollInfluence = 0.2;
var steeringIncrement = .02;
var steeringClamp = .3;
var maxEngineForce = 3000;
var maxBreakingForce = 100;
var speed = 0;
var quat = new THREE.Quaternion();
var acceleration = false;
var braking = false;
var right = false;
var left = false;
var engineForce = 0;
var vehicleSteering = 0;
var breakingForce = 0;
var carResize = 0.6;
var vehicle;



// Physics variables
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;

var syncList = [];
var time = 0;
var clock = new THREE.Clock();

Ammo().then(function() { //Tudo que usa a física tem que estar dentro dessa função
	initPhysics();
	createObjects();
  switchSpeedway(1);	
	render();
});

function initPhysics() {
	// Physics configuration
	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
	physicsWorld.setGravity( new Ammo.btVector3( 0, -15.82, 0 ) );
}


var TRANSFORM_AUX = null;
var ZERO_QUATERNION = new THREE.Quaternion(0, 0, 0, 1);
var materialGround = new THREE.MeshPhongMaterial({ color: "rgb(180, 180, 180)" });

function createWireFrame(mesh)
{	
	// wireframe
	var geo = new THREE.EdgesGeometry( mesh.geometry ); // or WireframeGeometry
	var mat = new THREE.LineBasicMaterial( { color: "rgb(80, 80, 80)", linewidth: 1.5} );
	var wireframe = new THREE.LineSegments( geo, mat );
	mesh.add( wireframe );
}

function initSpeedway(speedway){
  speedway.blocks.forEach(function(block) {
    physicsWorld.addRigidBody( block.body );
    scene.add(block.block); //Adiciona na cena cada cube do array de blocos 
    scene.add(block.fundo); //Adiciona na cena o fundo de cada cube do array de blocos 
  })
  speedway.muroDentro.forEach(function(block) {
    physicsWorld.addRigidBody( block.body );
    scene.add(block.block); //Adiciona na cena cada cube do array de blocos 
  })
  speedway.muroFora.forEach(function(block) {
    physicsWorld.addRigidBody( block.body );
    scene.add(block.block); //Adiciona na cena cada cube do array de blocos 
  })
  speedway.ramps.forEach(function(block) {
    block.bodys.forEach(function(body){
      physicsWorld.addRigidBody( body );
    })
    scene.add(block.ramp);  
  })

  swCornersX = speedway.cornersX;
  swCornersZ = speedway.cornersZ;;
  swInitx = speedway.xInitialBlock;
  swInitz = speedway.zInitialBlock;
  blockSize = speedway.blockSize;

  speedway.blocks.forEach( e => {
    e.block.castShadow = false;
    e.fundo.castShadow = false;
  });
}

function createObjects() {
  speedway = new Speedway(15, 1);
  initSpeedway(speedway);
  
  var ground = createBox(new THREE.Vector3(0, -2, 0), ZERO_QUATERNION, 1000, 1, 1000, 0, 2, materialGround, true);
  setGroundTexture(ground);
  ground.visible = true

  var textureLoader = new THREE.TextureLoader();
  let licensePlate = textureLoader.load("https://i.ibb.co/R9tkkV0/license-plate.png")
  cybertruck = new Cybertruck(licensePlate);
  scene.add(cybertruck.mesh);
    cybertruck.mesh.scale.set(carResize,carResize,carResize);
  scene.add(cybertruck.wheelsH[0]);
    cybertruck.wheelsH[0].scale.set(1.2 * carResize,1.2 * carResize,1.2 * carResize);
  scene.add(cybertruck.wheelsH[1]);
    cybertruck.wheelsH[1].scale.set(1.2 * carResize,1.2 * carResize,1.2 * carResize);
  scene.add(cybertruck.wheelsH[2]);
    cybertruck.wheelsH[2].scale.set(1.2 * carResize,1.2 * carResize,1.2 * carResize);
  scene.add(cybertruck.wheelsH[3]);
    cybertruck.wheelsH[3].scale.set(1.2 * carResize,1.2 * carResize,1.2 * carResize);
  cybertruck.mesh.quaternion.copy(quat)
  objectToFollow = cybertruck.mesh;
  cybertruck.updateNumCorners(swCornersX);
  //addPhysicsCar(-300, 2, 0);
  addPhysicsCar(0, 5, 300);
  
  
}

function setGroundTexture(mesh)
{
	var textureLoader = new THREE.TextureLoader();
	textureLoader.load( "../assets/textures/grid.png", function ( texture ) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 100, 100 );
		mesh.material.map = texture;
		mesh.material.needsUpdate = true;
	} );
}

function createBox(pos, quat, w, l, h, mass = 0, friction = 1, material, receiveShadow = false) {
	if(!TRANSFORM_AUX)
		TRANSFORM_AUX = new Ammo.btTransform();
	var shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
	var geometry = new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));

	var mesh = new THREE.Mesh(shape, material);
		mesh.castShadow = true;
		mesh.receiveShadow = receiveShadow;
	mesh.position.copy(pos);
	mesh.quaternion.copy(quat);
	scene.add( mesh );

	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
	transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
	var motionState = new Ammo.btDefaultMotionState(transform);

	var localInertia = new Ammo.btVector3(0, 0, 0);
	geometry.calculateLocalInertia(mass, localInertia);

	var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
	var body = new Ammo.btRigidBody(rbInfo);
	body.setFriction(friction);

	physicsWorld.addRigidBody( body );

	if (mass > 0) {
		// Sync physics and graphics
		function sync(dt) {
			var ms = body.getMotionState();
			if (ms) {
				ms.getWorldTransform(TRANSFORM_AUX);
				var p = TRANSFORM_AUX.getOrigin();
				var q = TRANSFORM_AUX.getRotation();
				mesh.position.set(p.x(), p.y(), p.z());
				mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
			}
		}
		syncList.push(sync);
	}
	return mesh;
}

function addPhysicsCar(x, y, z){
  // ------------------- AMMO PHYSICS
  // Chassis
  var transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(x, y, z));
  transform.setRotation(new Ammo.btQuaternion(0,-1,0,1));
  //transform.setRotation(new Ammo.btQuaternion(0,0,0,-1));
  var motionState = new Ammo.btDefaultMotionState(transform);
  var localInertia = new Ammo.btVector3(0, 0, 0);
  var carChassi = new Ammo.btBoxShape(new Ammo.btVector3(cybertruck.width * .5 * carResize, cybertruck.height * .2 * carResize, cybertruck.depth * .5 * carResize));
  carChassi.calculateLocalInertia(massVehicle, localInertia);
  var bodyCar = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, carChassi, localInertia));
  bodyCar.setActivationState(4);
  physicsWorld.addRigidBody(bodyCar);
  

  // Raycast Vehicle
  var tuning = new Ammo.btVehicleTuning();
  var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
  vehicle = new Ammo.btRaycastVehicle(tuning, bodyCar, rayCaster);
  vehicle.setCoordinateSystem(0, 1, 2);
  physicsWorld.addAction(vehicle);


  var wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
  var wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

  function addWheel(isFront, pos, radius,wheelAxleCS) {

      var wheelInfo = vehicle.addWheel(
              pos,
              wheelDirectionCS0,
              wheelAxleCS,
              suspensionRestLength,
              radius,
              tuning,
              isFront);

      isFront ? wheelInfo.set_m_suspensionStiffness(suspensionStiffness) : wheelInfo.set_m_suspensionStiffness(suspensionStiffness/2);
      wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
      isFront ? wheelInfo.set_m_wheelsDampingCompression(suspensionCompression) : wheelInfo.set_m_wheelsDampingCompression(suspensionCompression*10);
      wheelInfo.set_m_frictionSlip(friction);
      wheelInfo.set_m_rollInfluence(rollInfluence);

  }

  addWheel(true, new Ammo.btVector3(cybertruck.width*0.58 * carResize,cybertruck.height*-0.16 * carResize,cybertruck.depth*0.3 * carResize), cybertruck.height * 0.23*1.2 * carResize,wheelAxleCS);
  addWheel(true, new Ammo.btVector3(cybertruck.width*-0.58 * carResize,cybertruck.height*-0.16 * carResize,cybertruck.depth*0.3 * carResize), cybertruck.height * 0.23*1.2 * carResize,wheelAxleCS);
  addWheel(false, new Ammo.btVector3(cybertruck.width*0.58 * carResize,cybertruck.height*-0.16 * carResize,cybertruck.depth*-0.3 * carResize), cybertruck.height * 0.23*1.2 * carResize,wheelAxleCS);
  addWheel(false, new Ammo.btVector3(cybertruck.width*-0.58 * carResize,cybertruck.height*-0.16 * carResize,cybertruck.depth*-0.3 * carResize), cybertruck.height * 0.23*1.2 * carResize,wheelAxleCS);

  var speedometer;
  speedometer = document.getElementById( 'speedometer' );

  //cybertruck.mesh.position.set(0,10,0)

  function sync(dt) {
      if (!cameraFree) speed = vehicle.getCurrentSpeedKmHour();
      else speed = cybertruck.speed;
      speedometer.innerHTML = (speed < 0 ? '(R) ' : '') + Math.abs(speed).toFixed(1) + ' km/h';
      breakingForce = 0;
      engineForce = 0;

      if (cameraFree) {
        vehicle.setBrake(1000, 0);
        vehicle.setBrake(1000, 1);
        vehicle.setBrake(1000, 2);
        vehicle.setBrake(1000, 3);
        var tm;
        stopMovement(vehicle);
        tm = vehicle.getChassisWorldTransform();
        tm.setOrigin( new Ammo.btVector3(cybertruck.mesh.position.x, cybertruck.mesh.position.y, cybertruck.mesh.position.z));
        tm.setRotation(new Ammo.btQuaternion(cybertruck.mesh.quaternion.x, cybertruck.mesh.quaternion.y, cybertruck.mesh.quaternion.z, cybertruck.mesh.quaternion.w))
      }
      else
      {
        applyForce();

        vehicle.applyEngineForce(engineForce, 2);
        vehicle.applyEngineForce(engineForce, 3);
      
        vehicle.setBrake(breakingForce, 2);
        vehicle.setBrake(breakingForce, 3);
      
        vehicle.setSteeringValue(vehicleSteering, 0);
        vehicle.setSteeringValue(vehicleSteering, 1);
      
        var tm, p, q, i;
        var n = vehicle.getNumWheels();
        for (i = 0; i < n; i++) {
            vehicle.updateWheelTransform(i, true);
            tm = vehicle.getWheelTransformWS(i);
            p = tm.getOrigin();
            q = tm.getRotation();
            cybertruck.wheelsH[i].position.set(p.x(), p.y(), p.z());
            cybertruck.wheelsH[i].quaternion.set(q.x(), q.y(), q.z(), q.w());
        }   
        tm = vehicle.getChassisWorldTransform();
        p = tm.getOrigin();
        q = tm.getRotation();
        cybertruck.mesh.position.set(p.x(), p.y(), p.z());
        cybertruck.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }

  }
  syncList.push(sync);
}

function stopMovement (vehicle){

  var tm, p, q, i;
    if (acceleration) {
      if (cybertruck.speed < 80)
      cybertruck.speed++;
    }
    if (braking) {
      if (cybertruck.speed > -80)
      cybertruck.speed--;
    }
    if (left) {
      if (vehicleSteering < steeringClamp)
        vehicleSteering += steeringIncrement;
    }
    else {
      if (right) {
        if (vehicleSteering > -steeringClamp)
          vehicleSteering -= steeringIncrement;
      }
      else {
        if (vehicleSteering < -steeringIncrement)
          vehicleSteering += steeringIncrement;
        else {
          if (vehicleSteering > steeringIncrement)
            vehicleSteering -= steeringIncrement;
          else {
            vehicleSteering = 0;
          }
        }
      }
    }
    if (!acceleration && !braking){
      if (cybertruck.speed > 5)
        cybertruck.speed--;
      else {
        if (cybertruck.speed < -5)  cybertruck.speed++;
        else cybertruck.speed = 0
      }
    }

    vehicle.setSteeringValue(vehicleSteering, 0);
    vehicle.setSteeringValue(vehicleSteering, 1);
  
    //var tm, p, q, i;
    for (i = 0; i < 4; i++) {
        vehicle.updateWheelTransform(i, true);
        tm = vehicle.getWheelTransformWS(i);
        p = tm.getOrigin();
        q = tm.getRotation();
        cybertruck.wheelsH[i].quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  
    var tireRadius = cybertruck.height * 0.23,
    feetPerMin = (cybertruck.speed * 1000) / 60,
    rpm = feetPerMin / (2 * Math.PI * (tireRadius / 12)),
    incRotate = (Math.PI * 2) * (rpm / 6e4) * (1e3 / 60);

 
    cybertruck.wheels.forEach(e => {
      e.rotation.x -= incRotate / 10;
  
      if (e.rotation.x >= Math.PI * 2)
        e.rotation.x = 0;
    });
}



//Move
function applyForce(){
  

  if (acceleration) {
    if (speed < 200){
        if (speed < -1)
          breakingForce = maxBreakingForce;
        else {
          if (speed < 100)
            engineForce = 3*maxEngineForce;
          else
          engineForce = maxEngineForce;
        }
        
    }
  }
  if (braking) {
    if (speed > 1)
      breakingForce = maxBreakingForce;
    else engineForce = -maxEngineForce / 2;
  }
  if (left) {
    if (vehicleSteering < steeringClamp)
      vehicleSteering += steeringIncrement;
  }
  else {
    if (right) {
      if (vehicleSteering > -steeringClamp)
        vehicleSteering -= steeringIncrement;
    }
    else {
      if (vehicleSteering < -steeringIncrement)
        vehicleSteering += steeringIncrement;
      else {
        if (vehicleSteering > steeringIncrement)
          vehicleSteering -= steeringIncrement;
        else {
          vehicleSteering = 0;
        }
      }
    }
  }
  if (!acceleration && !braking){
    if (speed > 1)
      breakingForce = maxBreakingForce/4;
    else engineForce = maxEngineForce / 4;
  }
  
}

function keyboardUpdate2() {

  keyboard.update();

  if(gameIsOnFlag){
    if ( keyboard.pressed("up")){
      acceleration = true;

      if(startStopwatchFlag){
        stopwatch.start();
        swLaps.start();
        startStopwatchFlag = false;
      }

    }else acceleration = false;
    if ( keyboard.pressed("down")) braking = true;
    else braking = false;
    if ( keyboard.pressed("left")) left = true;
    else left = false;
    if ( keyboard.pressed("right")) right = true;
    else right = false

    if(keyboard.pressed("W")){
      var tm;
      tm = vehicle.getChassisWorldTransform();      
      tm.setRotation(new Ammo.btQuaternion(0, 1, 0, 0));
      
    }

    if(keyboard.pressed("S")){
      var tm;
      tm = vehicle.getChassisWorldTransform();
      tm.setRotation(new Ammo.btQuaternion(0, 0,0, -1));
    }

    if(keyboard.pressed("A")){
      var tm;
      tm = vehicle.getChassisWorldTransform();
      tm.setRotation(new Ammo.btQuaternion(0, -1,0, 1));
    }

    if(keyboard.pressed("D")){
      var tm;
      tm = vehicle.getChassisWorldTransform();
      tm.setRotation(new Ammo.btQuaternion(0, 1,0, 1));
    }

    if(keyboard.down("R")) {
      var tm;
      tm = vehicle.getChassisWorldTransform();
      if(speedway.type == 3){
        tm.setOrigin(new Ammo.btVector3(-300,3,0));
        tm.setRotation(new Ammo.btQuaternion(0, 0,0, -1));
      }else{
        tm.setOrigin(new Ammo.btVector3(0,3,300));
        tm.setRotation(new Ammo.btQuaternion(0, 1,0, -1));
      }
      
    }

  }else{
    acceleration = false;
    breaking = true;
  }

  if(keyboard.pressed("1")) switchSpeedway(1);
  if(keyboard.pressed("2")) switchSpeedway(2);
  if(keyboard.pressed("3")) switchSpeedway(3);
  if(keyboard.pressed("4")) switchSpeedway(4);
  
  
  
}

function switchSpeedway(sw){
  gameIsOnFlag = true;
  
  //Remove old speedway:
  speedway.blocks.forEach(function(block) {
    physicsWorld.removeRigidBody( block.body );
    scene.remove(block.block); 
    scene.remove(block.fundo); 
  })
  speedway.muroDentro.forEach(function(block) {
    physicsWorld.removeRigidBody( block.body );    
    scene.remove(block.block); 
  })
  speedway.muroFora.forEach(function(block) {
    physicsWorld.removeRigidBody( block.body );
    scene.remove(block.block); 
  })
  speedway.ramps.forEach(function(block) {
    block.bodys.forEach(function(body){
      physicsWorld.removeRigidBody( body );
    })
    scene.remove(block.ramp);  
  })

  //
  //add new speedway
  speedway = new Speedway(15, sw);
  initSpeedway(speedway);
  swCornersX = speedway.cornersX;
  swCornersZ = speedway.cornersZ;;
  swInitx = speedway.xInitialBlock;
  swInitz = speedway.zInitialBlock;
  blockSize = speedway.blockSize;

  
  var tm;
  tm = vehicle.getChassisWorldTransform();
  

  if(sw == 3){
    tm.setOrigin(new Ammo.btVector3(-300,3,0));
    tm.setRotation(new Ammo.btQuaternion(0, 0,0,-1));
    
  }else{
    tm.setOrigin(new Ammo.btVector3(0,3,300));
    tm.setRotation(new Ammo.btQuaternion(0,-1,0,1));
    
  }
  
  

  stopwatch = new Stopwatch();
  swLaps = new Stopwatch();
  startStopwatchFlag = true;

  lapTimes = [];
  firstLapFlag = secLapFlag = thirdLapFlag = fourthLapFlag = true;
  stopwatchInfo.changeBestLap("Best Lap: 00:00")
}

showInformation();
function showInformation()
{
  var controls = new InfoBox();
  // Use this to show information onscreen
    controls.add("Controles:");
    controls.addParagraph();
    controls.add("Setas Direcionais para mover");
    controls.add("1,2,3,4 para mudar de pista");
    controls.add("ESPAÇO para modo inspeção");
    controls.add("W,A,S,D para desvirar o carro");
    controls.add("R para colocar o carro na linha de chegada");
    controls.show();
    controls.infoBox.style.backgroundColor = "rgba(0,0,0,0.2)";
}


//Camera

function cameraControl()
{
  changeCamera();
  
  if (cameraFree)
    trackballUpdate()
  else
    cameraFollow();

}
function trackballUpdate(){
  trackballControls.update();
  
  spotlight.position.set(TrackballCamera.position.x + 30, TrackballCamera.position.y - 3, TrackballCamera.position.z - 10);
  // spotlight.up.set(0,1,0)
  // spotlight.lookAt(objectToFollow.position.x + 0, objectToFollow.position.y + 0, objectToFollow.position.z + 0);
  spotlight.target = cybertruck.wheelsH[1];
} 
function changeCamera()
{
  if ( keyboard.down("space") )
  {
    gameIsOnFlag = true;
    // Troca de camera
    cameraFree = !cameraFree;
    setupCamera();
  }
}

function switchLight()
{
  spotlight.visible = !spotlight.visible;
  directionalLight.visible = !directionalLight.visible;
}

function setupCamera()
{
  
  if (!cameraFree)
    {
      // Quando desativado o trackball
      // Ativar outros objetos a serem visíveis
      // speedway.blocks.forEach(function(block){
      //   block.cube.visible = true;
      //   block.cubeFundo.visible = true;
      // })
      // plane.visible = true;
      switchLight()

      physicsWorld.setGravity( new Ammo.btVector3( 0, -15.82, 0 ) )
    }
    else 
    {
      // Quando ativado o trackball
      // Arrumar Posicao
      trackballControls.reset;
      trackballControls.target.set( objectToFollow.position.x, objectToFollow.position.y, objectToFollow.position.z );
      TrackballCamera.up.set( 0,1,0 );
      TrackballCamera.position.set(objectToFollow.position.x + 80, 80, objectToFollow.position.z + 80);
      TrackballCamera.lookAt(objectToFollow.position);
      
      // Desativar visibilidade de outros objetos
      // speedway.blocks.forEach(function(block){
      //   block.cube.visible = false;
      //   block.cubeFundo.visible = false;
      // })

      //plane.visible = false;

      switchLight()

      physicsWorld.setGravity( new Ammo.btVector3( 0, 0, 0 ) )
    
    }
}
//var objectToFollow = cybertruck.mesh;
function cameraFollow()
{
  var dir = new THREE.Vector3();
  objectToFollow.getWorldDirection(dir);
  camera.position.set(objectToFollow.position.x + dir.x*15 + 80, 80, objectToFollow.position.z + 80 + dir.z*15);
  camera.lookAt(objectToFollow.position.x + dir.x*15, 0, objectToFollow.position.z +dir.z*15);

  directionalLight.position.set(objectToFollow.position.x + 20, 50, objectToFollow.position.z + 80);
  directionalLight.target = cybertruck.wheelsH[2];
}

function cameraRenderer ()
{
  if (cameraFree)
  {
    var width = window.innerWidth;
    var height = window.innerHeight;

    renderer.setViewport(0, 0, width, height); // Reset viewport    
    renderer.setScissorTest(false); // Disable scissor to paint the entire window
    renderer.setClearColor("rgb(80, 70, 170)");    
    renderer.clear();   // Clean the window

    renderer.render(scene, TrackballCamera);
  }
  else
  {
  
    var width = window.innerWidth;
    var height = window.innerHeight;

    renderer.setViewport(0, 0, width, height); // Reset viewport    
    renderer.setScissorTest(false); // Disable scissor to paint the entire window
    renderer.setClearColor("rgb(80, 70, 170)");    
    renderer.clear();   // Clean the window
    renderer.render(scene, camera);

    var offset = 30; 
    renderer.setViewport(width-vcWidth-offset, height-vcHeidth-offset, vcWidth, vcHeidth);  // Set virtual camera viewport  
    renderer.setScissor(width-vcWidth-offset, height-vcHeidth-offset, vcWidth, vcHeidth); // Set scissor with the same size as the viewport
    renderer.setScissorTest(true); // Enable scissor to paint only the scissor are (i.e., the small viewport)
    renderer.setClearColor("rgb(60, 50, 150)");  // Use a darker clear color in the small viewport 
    renderer.clear(); // Clean the small viewport

    renderer.render(scene, map);
    //console.log(map)
  }
}


function updateLapInfo() {
  stopwatchInfo.changeStopwatch(stopwatch.format);
  stopwatchInfo.changeLap("Lap: " + cybertruck.lap + "/4");
  stopwatchInfo.changeActualLap(swLaps.format);
  
  if((cybertruck.lap == 1) && firstLapFlag){
    //stopwatchInfo.add("Lap 1: " + swLaps.format);
    lapTimes.push(swLaps.format);
    updateBestLap(swLaps.mm, swLaps.ss);
    swLaps.clear();
    firstLapFlag = false;
  }else {
    if((cybertruck.lap == 2) && secLapFlag){
      //stopwatchInfo.add("Lap 2: " + swLaps.format);
      lapTimes.push(swLaps.format);
      updateBestLap(swLaps.mm, swLaps.ss);
      swLaps.clear();
      secLapFlag = false;
    }else{
      if((cybertruck.lap == 3) && thirdLapFlag){
        //stopwatchInfo.add("Lap 3: " + swLaps.format);
        lapTimes.push(swLaps.format);
        updateBestLap(swLaps.mm, swLaps.ss);
        swLaps.clear();
        thirdLapFlag = false;
      }else{
        if((cybertruck.lap == 4) && fourthLapFlag){
          //stopwatchInfo.add("Lap 4: " + swLaps.format);
          lapTimes.push(swLaps.format);
          updateBestLap(swLaps.mm, swLaps.ss);
          //swLaps.clear();
          swLaps.stop();
          fourthLapFlag = false;
        }
      }
    }
  }
}

function updateBestLap(M, S){
  if(M < bestM){
    stopwatchInfo.changeBestLap("Best Lap: " + (M < 10 ? '0'+ M : M) + ":" + (S < 10 ? '0'+ S : S));
    bestM = M;
    bestS = S;
  }else{
    if(M == bestM && S < bestS){
      stopwatchInfo.changeBestLap("Best Lap: " + (M < 10 ? '0'+ M : M) + ":" + (S < 10 ? '0'+ S : S))
      bestM = M;
      bestS = S;
    }
  }
}


function isGameOver(){
  if(cybertruck.lap == 4){
    if(gameIsOnFlag)  gameOverInf();
    gameIsOnFlag = false;

  }
}

var gameOverInfo = new gameInfo();
function gameOverInf(){
  gameOverInfo.add("Total time : " + stopwatch.format);
  stopwatch.stop();
  for(var i=0; i < lapTimes.length; i++){
    gameOverInfo.add((i+1) + "º lap: " + lapTimes[i]);
  }
  gameOverInfo.show();
}

//render();
function render()
{
  // Physics
  var dt = clock.getDelta();
  for (var i = 0; i < syncList.length; i++)
    syncList[i](dt);
  time += dt;
  physicsWorld.stepSimulation( dt, 10 );


  stats.update(); // Update FPS
  keyboardUpdate2();
  if(gameIsOnFlag){
    cybertruck.movement(swCornersX, swCornersZ, swInitx, swInitz, blockSize);
  }
  updateLapInfo();
  isGameOver();
  cameraControl();
  requestAnimationFrame(render);
  cameraRenderer(); // Render scene 
}
