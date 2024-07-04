import * as THREE from "three";
import * as Events from "./Events";
import {GUI} from "dat.gui";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { RGBELoader } from "three/examples/jsm/Addons.js";

import { OBB } from 'three/addons/math/OBB.js';

import player_vs from './lib/player_vShader.glsl';
import player_fs from './lib/player_fShader.glsl';

import obstacle_vs from './lib/obstacle_vShader.glsl';
import obstacle_fs from './lib/obstacle_fShader.glsl';

import plane_vs from './lib/plane_vShader.glsl';
import plane_fs from './lib/plane_fShader.glsl';
import { EPSILON } from "three/examples/jsm/nodes/Nodes.js";


export default class GameScene extends THREE.Scene {
  constructor() {
    super();
    this.keyboard = {};
    this.gameState = "intro";
    this.lastSpawnTime = 0;
    this.obstSpawnRate = 1; //seconds
    this.playerSpeed = 10; //10
    this.groundSpeed = 0.18; // 0.09
    this.numObstaclesRow = 10; // 10
    this.spaceWidth = 1; // 1
    this.savedElapsedTime = 0;
    this.planeSize = [10, 50];
    this.sceneRotates = false;
    this.flag = true;
  }

  async initialize(camera, renderer) {


    this.camera = camera;
    this.renderer = renderer;

    this.groupAll = new THREE.Group();
    this.add(this.groupAll);

    this.camera.position.set(0, 3, 6);
    // this.add(this.camera);
    this.groupAll.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;

    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    this.clock = new THREE.Clock();

    /* const axesHelper = new THREE.AxesHelper(100);
    this.add(axesHelper); */

    //LIGHTS
    this.light = new THREE.DirectionalLight(0xffffff, 2.0); //color, intensity
    this.light.position.set(20, 4, 16);
    // this.light.position.set(2, 2, 0);
    //enlarge shadow area of light
    this.light.shadow.camera.top = 20;
    this.light.shadow.camera.bottom = -20;
    this.light.shadow.camera.left = -20;
    this.light.shadow.camera.right = 20;
    this.light.shadow.camera.near = 10;
    this.add(this.light);
    this.light.castShadow = true;
    // const dirLigHelper = new THREE.DirectionalLightHelper(this.light, 0.5, 0x000000);
    // this.add(dirLigHelper) 

    //color and intensity
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5); //color, intensity
    this.add(this.ambientLight);

    //ENVIRONMENT MAP
    const envMap = await new RGBELoader().loadAsync('images/industrialSunset.hdr');
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    this.background = envMap;
    
    //GROUND
    const groundText = new THREE.TextureLoader().load('textures/groundTextureCartoon.jpg');
    groundText.colorSpace = THREE.LinearSRGBColorSpace;//////////////////////////////////////////
    
    const ratio = this.planeSize[1]/this.planeSize[0];
    this.repeatTextX = 2;
    const planeGeom = new THREE.BoxGeometry(this.planeSize[0], 1, this.planeSize[1]);
    this.planeUniforms = {
      u_texture: {type: 't', value: groundText},
      u_alpha: {value: 0.5},
      u_multiplier: {value: 30},
      u_time: {value: 0},
      u_speed: {value: this.groundSpeed},
      u_texture: {value: groundText},
      u_repeatText: {value: new THREE.Vector2(this.repeatTextX, ratio*this.repeatTextX)},
    }
    this.planeMat = new THREE.ShaderMaterial({
      uniforms: this.planeUniforms,
      vertexShader: plane_vs,
      fragmentShader: plane_fs,
    });

    this.planeMatThree = new THREE.MeshPhongMaterial({
      map: groundText,
      shininess: 5,
      specular: 0xffffff,
    });
    this.planeMatThree.map.wrapS = THREE.RepeatWrapping;
    this.planeMatThree.map.wrapT = THREE.RepeatWrapping;
    this.planeMatThree.map.repeat.set(this.repeatTextX, ratio*this.repeatTextX);
    
    
    this.plane = new THREE.Mesh(planeGeom, this.planeMat);
    this.plane.position.set(0, -1, 0);
    this.plane.name = "ground";
    this.groupAll.add(this.plane);
    this.plane.receiveShadow = true;



    //PLAYER OBJECT
    const dinoText = new THREE.TextureLoader().load('models/dinosaur/textures/Dino_baseColor.jpeg');
    dinoText.flipY = false; //needed for gltf models`
    dinoText.colorSpace = THREE.SRGBColorSpace;//////////////////////////////////////////
    

    //player shaders uniforms
    this.playerUniforms = {
      u_time: {value: this.clock.getElapsedTime()},
      u_texture: {type: 't', value: dinoText},
      shininess: {type: 'f', value: 10}, //0 to 100 ,def 5
      lightDir: {type: 'v3', value: this.light.position}, //passed by reference.. so no need to update during time
      lightInt: {type: 'f', value: this.light.intensity*0.5},
      ambientInt: {type: 'f', value: this.ambientLight.intensity},
      specularInt: {type: 'f', value: 0.3}, //material property ,def 0.3
    };
    

    //player custom shader
    this.playerMat = new THREE.ShaderMaterial({
      wireframe: false,
      uniforms: this.playerUniforms,
      vertexShader: player_vs,
      fragmentShader: player_fs,
    });

    this.playerMatThree = new THREE.MeshPhongMaterial({
      map: dinoText,
      shininess: 5, //5
      specular: 0x555555, //0xffffff
    });

    this.player = await this.loadPlayer();
    this.player.traverse((child) => {
      if(child.isMesh){
        child.material = this.playerMat;
        child.castShadow = true;
      }
    });
    this.player.name = "player";
    this.groupAll.add(this.player);

    this.player.scale.set(0.4,0.4,0.4);
    this.player.rotation.y = Math.PI;
    this.player.position.set(0,0.15,3);

    this.controls.target = this.player.position.clone(); //clone: otherwise player moves


    this.light.target.position.set(this.player.position.clone());
    


    //OBSTACLES
    this.obstacles = [];
    this.cactus = await this.loadCactus();




    Events.gameReady(this);
    Events.addKeysListener(this.keyboard);
    Events.addTouchListeners(this.keyboard);
    this.addGUI();

    if (window.visualViewport.width <= 800){
      this.gui.hide();
      this.stats.dom.style.visibility = "hidden";
    }
    Events.guiVisibilityListener(this.gui, this.stats);
    Events.gamePausedListener(this); // listener for window visibility change
    //this.gameState = "started"; // for debugging

  }


  /////////////////////////////////////////////////////////
  //////////////////// FUNCTIONS //////////////////////////
  /////////////////////////////////////////////////////////



  update() {
    this.stats.update();
    //this.controls.update(); // needed only if controls.enableDamping or if controls.autoRotate = true
    //getDelta always before getElapsedTime and invokate only once
    
    if (this.gameState == "started"){
      const delta = this.clock.getDelta();
      // this.light.position.x = 8*Math.sin(this.clock.getElapsedTime()); //debugging-----------------
      if (this.sceneRotates) this.groupAll.rotateY(0.005);

      const elapsedTime = this.clock.getElapsedTime();
      Events.setTimer(elapsedTime);
      this.playerUniforms.u_time.value = elapsedTime /* % (1/this.groundSpeed) */;
      this.cactusUniforms.u_time.value = elapsedTime /* % (1/this.groundSpeed) */;      
      this.planeUniforms.u_time.value = elapsedTime % (1/this.groundSpeed); // to fix precision problem in shader when time is too big
      // this.planeMatThree.map.offset.y += this.groundSpeed * delta* 5.0;
      this.planeMatThree.map.offset.y = (this.groundSpeed*elapsedTime*5*this.repeatTextX) % 1;
      this.gameStartUpdate(delta, elapsedTime);
      
    }
  }

  gameStartUpdate(delta, elapsedTime){
    for (let obstGroup of this.obstacles){
      //move position z of obstacles in sync with ground
      obstGroup.position.z += delta*this.groundSpeed * this.planeSize[1];
    }
    
    if (elapsedTime - this.lastSpawnTime >= this.obstSpawnRate){  
      this.obstacles.push(this.spawnObstacleRow(this.cactus, this.numObstaclesRow));
      for (let obstGroup of this.obstacles){        
        if(obstGroup.position.z > 5){ //center + 5 behind player
          this.groupAll.remove(obstGroup);
          this.obstacles.shift(); //because obstacles are spawned in order
        }
      }
      this.lastSpawnTime = elapsedTime;
    }

    this.playerObstCollision();
    this.movePlayer(delta);
  }


  playerObstCollision(){
    const plrBox = this.genPlayerBoundingBox();
    this.obstacles.forEach((obstGroup) => {
      obstGroup.children.forEach((obst) => {
        if(this.checkCollision({obj1Box: plrBox, obj2: obst})){
        // if(this.checkCollisionObb({obj1: this.player, obj2: obst})){
          Events.gameOver(this);
        }
      });
    });
  }

  genPlayerBoundingBox(){
    
    const boundBoxPlr = new THREE.Box3().setFromObject(this.player.clone(), false);  // if true is used, poor performance
    //PLAYER (obj1)
    const shrinkVecPlayer = new THREE.Vector3(-0.1, -0.0, -0.2);
    boundBoxPlr.expandByVector(shrinkVecPlayer);  // shrink bounding box to make it more accurate
    return boundBoxPlr;
  }

  checkCollision({obj1Box, obj2}){
    const boundBoxObst = new THREE.Box3().setFromObject(obj2.clone(), false);  // if true is used, poor performance

    // this.groupAll.remove(this.groupAll.children.find((child) => child.name === "plrBox"));
    // this.groupAll.remove(this.groupAll.children.find((child) => child.name === "obstBox"+obj2.uuid));
    
    //OBSTACLE (obj2)
    const shrinkVecObst = new THREE.Vector3(-0.1, -0, -0.1);
    boundBoxObst.expandByVector(shrinkVecObst); // shrink bounding box to make it more accurate
    
    //because parent of obj2 is not groupAll but is a group of obstacles
    const center = boundBoxObst.getCenter(new THREE.Vector3());
    const posOffset = obj2.parent.position.clone().add(obj2.position.clone());
    let size = boundBoxObst.getSize(new THREE.Vector3());
    boundBoxObst.translate(posOffset.clone().sub(center).add(new THREE.Vector3(0, size.y / 2, 0)))




    /*
    const sizeObst = new THREE.Vector3();
    boundBoxObst.getSize(sizeObst);
    const geomObst = new THREE.BoxGeometry(sizeObst.x, sizeObst.y, sizeObst.z);
    const matObst = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
    const obstBox = new THREE.Mesh(geomObst, matObst);
    obstBox.name = "obstBox";
    
    // Convert to world coordinates (because obj2 parent is not groupAll)
    const worldPosition = new THREE.Vector3();
    obj2.getWorldPosition(worldPosition);

    // Convert world coordinates to groupAll's local coordinates
    const localPosition = new THREE.Vector3();
    this.groupAll.worldToLocal(localPosition.copy(worldPosition));
    obstBox.position.copy(localPosition);
    obstBox.position.y += 0.9;*/

    if (obj1Box.intersectsBox(boundBoxObst)){

      /* //PLAYER (obj1)
      const sizePlr = obj1Box.getSize(new THREE.Vector3());
      const geomPlr = new THREE.BoxGeometry(sizePlr.x, sizePlr.y, sizePlr.z);
      const matPlr = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
      const plrBox = new THREE.Mesh(geomPlr, matPlr);
      plrBox.name = "plrBox";
      plrBox.position.copy(this.player.position);
      plrBox.position.y += 0.2; 

      //OBSTACLE (obj2)
      const sizeObst = boundBoxObst.getSize(new THREE.Vector3());
      const geomObst = new THREE.BoxGeometry(sizeObst.x, sizeObst.y, sizeObst.z);
      const matObst = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
      const obstBox = new THREE.Mesh(geomObst, matObst);
      obstBox.name = "obstBox"+obj2.uuid;
      obstBox.position.copy(obj2.position.clone().add(obj2.parent.position.clone())
        .add(new THREE.Vector3(0, size.y / 2, 0)));

      this.groupAll.add(plrBox); 
      this.groupAll.add(obstBox); */

      //helpers 
      const helperPlr = new THREE.Box3Helper(obj1Box.clone(), 0xff0000);
      helperPlr.name = "plrBox";
      const helperObst = new THREE.Box3Helper(boundBoxObst, 0xff0000);
      helperObst.name = "obstBox"+obj2.uuid;
      this.groupAll.add(helperPlr);
      this.groupAll.add(helperObst);
    }



    return obj1Box.intersectsBox(boundBoxObst);
  }

  checkCollisionObb({obj1, obj2}) {

    this.groupAll.remove(this.groupAll.children.find((child) => child.name === "plrBox"));
    this.groupAll.remove(this.groupAll.children.find((child) => child.name === "obstBox"+obj2.uuid));

    //obj2
    let geom2= obj2.geometry;
    obj2.traverse((child) => {
      if(child.isMesh){
        geom2 = child.geometry.clone();
        geom2.applyMatrix4(obj2.matrix)
        // let pos = obj2.position.clone().add(obj2.parent.position.clone());
        let pos = obj2.parent.position.clone();
        geom2.translate(pos.x, pos.y, pos.z);
        geom2.computeBoundingBox();
      }
    });
    let boundingBox2 = new THREE.Box3().setFromObject(obj2);
    const mesh2 = new THREE.Mesh( geom2, new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true}));
    // mesh2.applyMatrix4(obj2.matrix); //set position, rotation and scale of obj2
    // mesh2.position.copy(obj2.position.clone().add(obj2.parent.position.clone())); //set position (because of obj2 parent)    
    mesh2.geometry.userData.obb = new OBB().fromBox3(boundingBox2);
    mesh2.name = "obstBox"+obj2.uuid;
    // this.groupAll.add(mesh2)

    //obj1
    let geom1 = obj1.geometry;
    obj1.traverse((child) => {
      if(child.isMesh){
        geom1 = child.geometry.clone();
        geom1.scale(obj1.scale.x, obj1.scale.y, obj1.scale.z);
        geom1.rotateX(-Math.PI/2).rotateY(obj1.rotation.y);
        geom1.translate(obj1.position.x, obj1.position.y, obj1.position.z);

        geom1.computeBoundingBox();
      }
    });
    // return true;
    let boundingBox1 = new THREE.Box3().setFromObject(obj1);
    const mesh1 = new THREE.Mesh( geom1, new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true}));
    mesh1.geometry.userData.obb = new OBB().fromBox3(boundingBox1);
    mesh1.name = "plrBox";
    // this.groupAll.add(mesh1)
    if (mesh1.geometry.userData.obb.intersectsOBB(mesh2.geometry.userData.obb, Number.EPSILON)){
      this.groupAll.add(mesh1);
      this.groupAll.add(mesh2);
      return true;
    }




    // return true;  
  }


  
  movePlayer(delta){
    const boundBoxSize = new THREE.Box3().setFromObject(this.player).getSize(new THREE.Vector3());

    /* if(this.keyboard["w"] || this.keyboard["arrowup"]){
      this.player.translateZ(this.playerSpeed*delta);
    }
    if(this.keyboard["s"] || this.keyboard["arrowdown"]){ 
      this.player.translateZ(-this.playerSpeed*delta);
    } */
   
    if((this.keyboard["a"] || this.keyboard["arrowleft"] )&& this.player.position.x > - this.planeSize[0]/2 + boundBoxSize.x/2){
      this.player.translateX(this.playerSpeed*delta)
      if (this.controls.enabled == false) this.camera.position.x -= this.playerSpeed*delta;
    }
    if((this.keyboard["d"] || this.keyboard["arrowright"]) && this.player.position.x < this.planeSize[0]/2 - boundBoxSize.x/2){
      this.player.translateX(-this.playerSpeed*delta)
      if (this.controls.enabled == false) this.camera.position.x += this.playerSpeed*delta;
    }
  }

  async loadPlayer(){
    const gltfLoader = new GLTFLoader();
    const player = (await gltfLoader.loadAsync('models/dinosaur/scene.gltf')).scene;
    return player;
  }

  async loadCactus(){
    const cactusTexture = new THREE.TextureLoader().load('models/cactus/10436_Cactus_v1_Diffuse.jpg');
    cactusTexture.flipY = false; //needed for gltf models
    cactusTexture.colorSpace = THREE.SRGBColorSpace;//////////////////////////////////////////
    

    const gltfLoader = new GLTFLoader();
    const cactus = (await gltfLoader.loadAsync('models/cactus/10436_Cactus_v1_max2010_it2.gltf')).scene;

    cactus.scale.set(0.007, 0.007, 0.007);
    cactus.rotation.x = -Math.PI/2;


    this.cactusUniforms = {
      u_time: {value: this.clock.getElapsedTime()},
      u_texture: {type: 't', value: cactusTexture},
      shininess: {type: 'f', value: 2}, //0 to 100
      lightDir: {type: 'v3', value: this.light.position}, //passed by reference.. so no need to update during time
      lightInt: {type: 'f', value: this.light.intensity*0.5},
      ambientInt: {type: 'f', value: this.ambientLight.intensity},
      specularInt: {type: 'f', value: 0.2}, //material property
    };


    this.cactusMat = new THREE.ShaderMaterial({
      wireframe: false,
      uniforms: this.cactusUniforms,
      vertexShader: obstacle_vs,
      fragmentShader: obstacle_fs,
      
    });

    this.cactusMatThree = new THREE.MeshPhongMaterial({
      map: cactusTexture,
      shininess: 10,
      specular: 0x333333,
    });

    cactus.traverse((child) => {
      if(child.isMesh){
        child.material = this.cactusMat;
        child.castShadow = true;
      }
    });
    return cactus;
  }

  spawnObstacleRow(model, numObstaclesRow){
    const group = new THREE.Group();    
    const boundBoxSize = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    
    const startingPosX = this.plane.position.x-this.planeSize[0]/2;
    group.position.set(startingPosX, -0.5, -this.planeSize[1]/2);
    //random number between 0 and numObstaclesRow (10 obstacles in total - the removed one)
    const randInt = Math.floor(Math.random()*(numObstaclesRow+1));
    let correctSpace = this.spaceWidth;
    if (randInt == numObstaclesRow|| randInt == 0) correctSpace += boundBoxSize.z;
    let space = 0;
    const obstSpacing = (this.planeSize[0]-boundBoxSize.z - correctSpace)/(numObstaclesRow-1);
    let pos = 0;
    for(let i = 0; i < numObstaclesRow; i++){
      if(i === randInt) space = correctSpace;
      const c = model.clone();
      c.position.x = boundBoxSize.x/2 + pos + space;
      pos += obstSpacing;
      
      //random rotation
      c.rotation.z = Math.random()*Math.PI*2;
      c.rotation.y = Math.random()*Math.PI*0.08-0.08*2;
      group.add(c);
      
      /* const boxHelper = new THREE.BoxHelper(c, 0xff0000); // bounding box
      this.add(boxHelper);
      group.add(boxHelper); */
    }
    group.opacity = 0.1;
    this.groupAll.add(group);
    return group;
  }


  addGUI(){
    this.gui = new GUI();
    this.gui.closed = true;

    this.GUIoptions = {
      orbitsControls: false,
      threeShader: false,
      sceneRotation: false,
      toneMapping: "ACESFilmicToneMapping",
      fog: false,
      fogNear: 20,
      fogFar: 25,
      cameraFOV: this.camera.fov,
    }

    this.gui.add(this.GUIoptions, "orbitsControls").onChange((value) => {
      if(value){
        this.controls.enabled = true;
        this.controls.update();

      }else{
        this.camera.position.set(this.player.position.clone().x, 3, 6);
        this.camera.lookAt(new THREE.Vector3(this.player.position.clone().x, 0, 0));
        this.controls.enabled = false;
      }
    });
    this.shaderGUIController = this.gui.add(this.GUIoptions, "threeShader").onChange((value)=>this.threeShaderCallback(value));

    this.threeShaderCallback = (value) => {
      if (value){
        this.player.traverse((child) => {
          if(child.isMesh){
            child.material = this.playerMatThree;
          }
        });
        this.cactus.traverse((child) => {
          if(child.isMesh){
            child.material = this.cactusMatThree;
          }
        });
        for (let obstGroup of this.obstacles){
          obstGroup.children.forEach((obst) => {
            obst.traverse((child) => {
              if(child.isMesh){
                child.material = this.cactusMatThree;
              }
          });
        });}
        this.plane.material = this.planeMatThree;
      }else{/////////// ELSE
        this.player.traverse((child) => {
          if(child.isMesh){
            child.material = this.playerMat;
          }
        });
        this.cactus.traverse((child) => {
          if(child.isMesh){
            child.material = this.cactusMat;
          }
        });
        for (let obstGroup of this.obstacles){
          obstGroup.children.forEach((obst) => {
            obst.traverse((child) => {
              if(child.isMesh){
                child.material = this.cactusMat;
              }
          });
        });}
        this.plane.material = this.planeMat;
      }
    };



    this.gui.add(this.GUIoptions, "sceneRotation").onChange((value) => {
      this.sceneRotates = value;
    });
    this.gui.add(this.GUIoptions, "toneMapping", ["NoToneMapping", "LinearToneMapping", "ReinhardToneMapping", "CineonToneMapping", "ACESFilmicToneMapping", "AgXToneMapping", "NeutralToneMapping", "CustomToneMapping"]).onChange((value) => {
      this.renderer.toneMapping = THREE[value];
    });
    this.gui.add(this.GUIoptions, "fog").onChange((value) => {
      if(value){
        this.fog = new THREE.Fog(0x9aaec2, 20, 25);
        this.fog.map = this.background;
      } else{
        this.fog = null;
      }
    });
    this.gui.add(this.GUIoptions, "fogNear", 0, 50).onChange((value) => {
      if (this.fog) this.fog.near = value;
    });
    this.gui.add(this.GUIoptions, "fogFar", 0, 50).onChange((value) => {
      if (this.fog) this.fog.far = value;
    });
    /* this.gui.add(this.GUIoptions, "cameraFOV", 60, 120).onChange((value) => {
      this.camera.fov = value;
      this.camera.updateProjectionMatrix();
    }); */
    
  }


}
