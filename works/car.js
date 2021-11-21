import * as THREE from '../../build/three.module.js';
import {degreesToRadians} from "../libs/util/util.js";

export function createCar() {
    
    var group = new THREE.Group();

    var scale = 0.5;


    // Set the parts of the pseudo-car
    var body = createCube(5.0, 15.0, 3.0, 20.0, 20.0, 20.0, false);
    body.rotateX(degreesToRadians(90));
    body.position.set(0.0, 0.5, 0.0)

    var ceiling = createCube(5.0, 6.0, 2.0, 20, 20, 20, false); // Adding the ceiling of the car
    ceiling.rotateX(degreesToRadians(90));
    ceiling.position.set(0.0, 3.0, 0.0);

    var axis1 = createCylinder(0.3, 0.3, 7.0, 10, 10, false);
    axis1.rotateZ(degreesToRadians(90));
    axis1.position.set(0.0, -1.0, 4.0);

    var axis2 = createCylinder(0.3, 0.3, 7.0, 10, 10, false);
    axis2.rotateZ(degreesToRadians(90));
    axis2.position.set(0.0, -1.0, -4.0);

    /*var roda1 = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
    roda1.position.set( 3.5, -1.0, 4.0);

    var roda2 = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
    roda2.position.set(-3.5, -1.0, 4.0);*/

    var roda3 = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
    roda3.position.set(3.5, -1.0, -4.0);

    var roda4 = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
    roda4.position.set(-3.5, -1.0, -4.0);

    var airfoil = createCube(5.0, 1.0, 2.0, 20, 20, 20, false); // Adding airfoil
    airfoil.rotateX(degreesToRadians(90));
    airfoil.position.set(0.0, 2.0, -7.0);

    var visor = createCube(5.0, 0.2, 2.0, 20, 20, 20, true); // Adding the visor
    visor.rotateX(degreesToRadians(90));
    visor.position.set(0.0, 3.0, 3.1);

    // Add objects to the group
    group.add( body );
    group.add( axis1);
    group.add( axis2);
    //group.add( roda1 );
    //group.add( roda2 );
    group.add( roda3 );
    group.add( roda4 );
    group.add( ceiling); //adding ceiling
    group.add( airfoil); //affing airfoil
    group.add( visor); //adding visor


    return group;
}

export function isOnTheSpeedway(car, speedway){
    var isOnTheWay = false;
    speedway.blocks.forEach(function(block){
        if((car.position.x >= block.x - 5 && car.position.x <= block.x + 5) && (car.position.y >= block.y - 5 && car.position.y <= block.y + 5)){
            isOnTheWay = true;
            block.passedBy = true;
        }
    })
    return isOnTheWay;
}

export function createRoda() {
    var roda = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
    return roda;
}

function createCube(width, height, depth, widthSegments, heightSegments, depthSegments, color)
{
  var geometry = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
  var material;
  if(!color)
    material = new THREE.MeshPhongMaterial({color:"rgb(255,216,1)"});
  else
    material = new THREE.MeshPhongMaterial({color:"rgb(0,0,0)"});
  var object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
  return object;
}


function createCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, color)
{
  var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
  var material;
  if(!color)
    material = new THREE.MeshPhongMaterial({color:"rgb(100,100,100)"});
  else
    material = new THREE.MeshPhongMaterial({color:"rgb(230,120,50)"});
  var object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
  return object;
}

function createTorus(radius, tube, radialSegments, tubularSegments, arc)
{
  var geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
  var material = new THREE.MeshPhongMaterial({color:"rgb(27,27,27)"});
  var object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
    object.rotateY(degreesToRadians(90));
  return object;
}

function createSphere(radius, widthSegments, heightSegments)
{
  var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, 0, Math.PI * 2, 0, Math.PI);
  var material = new THREE.MeshPhongMaterial({color:"rgb(255,255,50)"});
  var object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
  return object;
}