import * as THREE from '../../build/three.module.js';
import {degreesToRadians} from "../libs/util/util.js";

export class Car{
  constructor(type, numSides){
    
    this.group = new THREE.Group();
    this.lap = 0;
    this.cornersPassed = [false];
    for(var i=1; i<numSides; i++) this.speedwaySides.push(false);
    if(type == 1){
      this.body = createCube(5.0, 15.0, 3.0, 20.0, 20.0, 20.0, false);
      this.ceiling = createCube(5.0, 6.0, 2.0, 20, 20, 20, false); 
      this.axis1 = createCylinder(0.3, 0.3, 7.0, 10, 10, false);
      this.axis2 = createCylinder(0.3, 0.3, 7.0, 10, 10, false);
      this.roda1 = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
      this.roda2 = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
      this.roda3 = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
      this.roda4 = createTorus(2.0, 1.0, 40, 40, Math.PI * 2);
      this.airfoil = createCube(5.0, 1.0, 2.0, 20, 20, 20, false);
      this.visor = createCube(5.0, 0.2, 2.0, 20, 20, 20, true);
      this.placeCar1();

    }else{//Implements the type 2 car

    }

    this.group.add( this.body );
    this.group.add( this.axis1);
    this.group.add( this.axis2);
    this.group.add( this.roda1 );
    this.group.add( this.roda2 );
    this.group.add( this.roda3 );
    this.group.add( this.roda4 );
    this.group.add( this.ceiling);
    this.group.add( this.airfoil);
    this.group.add( this.visor);
  }

  placeInitialPosition(sideSize){
    //this.group.translateY(-(sideSize*10)/2);
    this.group.translateZ((sideSize*10)/2);
    this.group.translateY(2.3);
    this.group.rotateY(degreesToRadians(-90));
    //this.group.rotateZ(degreesToRadians(-90))
  }

  placeCar1(){
    this.body.rotateX(degreesToRadians(90));
    this.body.position.set(0.0, 0.5, 0.0)
    this.ceiling.rotateX(degreesToRadians(90));
    this.ceiling.position.set(0.0, 3.0, 0.0);
    this.axis1.rotateZ(degreesToRadians(90));
    this.axis1.position.set(0.0, -1.0, 4.0);
    this.axis2.rotateZ(degreesToRadians(90));
    this.axis2.position.set(0.0, -1.0, -4.0);
    this.roda1.position.set( 3.5, -1.0, 4.0);
    this.roda2.position.set(-3.5, -1.0, 4.0);
    this.roda3.position.set(3.5, -1.0, -4.0);
    this.roda4.position.set(-3.5, -1.0, -4.0);
    this.airfoil.rotateX(degreesToRadians(90));
    this.airfoil.position.set(0.0, 2.0, -7.0);
    this.visor.rotateX(degreesToRadians(90));
    this.visor.position.set(0.0, 3.0, 3.1);

  }

  isOnTheSpeedway(speedway){
    var isOnTheWay = false;
    var g = this.group;
    speedway.blocks.forEach(function(block){
        if((g.position.x >= block.x - 5 && g.position.x <= block.x + 5) && (g.position.z >= block.z - 5 && g.position.z <= block.z + 5)){
            isOnTheWay = true;
            block.passedBy = true;
        }
    })
    return isOnTheWay;
  }

  updateNumCorners(speedway){
    for(var i=1; i<speedway.cornersX.length; i++){ //Counts how much pieces the speedway has and add a false in cornersPassed for each one
      this.cornersPassed.push(false);
    }
  }

  movement(speedway){
    var cornerCount = 0;
    var lapFlag = true;
    
    if(this.hasPassedRightWay(cornerCount)){
      //console.log("Fisrt if");
      if(this.hitCorner(cornerCount, speedway)){
        console.log("Hit Corner");
        cornerCount++;
      }else{
        if(cornerCount == speedway.cornersX.length && lapFlag && this.hitFinishLine()){
          console.log("Hit finish line");
          this.lap++;
          lapFlag = false;
        }
      }
    }
  }

  hitCorner(cornerCount, speedway){
    var conditionX = ( (Math.abs(this.group.position.x) >= Math.abs(speedway.cornersX[cornerCount])*0.85)  && (Math.abs(this.group.position.x) <= Math.abs(speedway.cornersX[cornerCount])*1.15) );
    var conditionZ = ( (Math.abs(this.group.position.z) >= Math.abs(speedway.cornersZ[cornerCount])*0.85)  && (Math.abs(this.group.position.z) <= Math.abs(speedway.cornersZ[cornerCount])*1.15) );
    return conditionX && conditionZ;
  }

  hitFinishLine(speedway){
    var conditionX =  ((Math.abs(this.group.position.x) >= Math.abs(speedway.xInitialBlock*0.85))  && (Math.abs(this.group.position.x) <= Math.abs(speedway.xInitialBlock*1.15) ));
    var conditionZ = ((Math.abs(this.group.position.z) >= Math.abs(speedway.zInitialBlock*0.85))  && (Math.abs(this.group.position.z) <= Math.abs(speedway.zInitialBlock*1.15) ));
    return conditionX && conditionZ;
  }

  hasPassedRightWay(pieceCount){
    var rightWay = true;
    for(var i=0; i<pieceCount; i++){
      if(this.cornersPassed[i] == false){
        rightWay = false;
      }
    }
    return rightWay;
  }
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