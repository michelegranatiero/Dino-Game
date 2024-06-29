import * as THREE from "three";
import * as Events from "./Events";
import {GUI} from "dat.gui";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { RGBELoader } from "three/examples/jsm/Addons.js";

import player_vs from './lib/player_vShader.glsl';
import player_fs from './lib/player_fShader.glsl';

import obstacle_vs from './lib/obstacle_vShader.glsl';
import obstacle_fs from './lib/obstacle_fShader.glsl';

import plane_vs from './lib/plane_vShader.glsl';
import plane_fs from './lib/plane_fShader.glsl';


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
    this.light = new THREE.DirectionalLight(0xffffff, 0.7); //color, intensity
    this.light.position.set(20, 4, 16);
    // this.light.position.set(-2, 2, -4);
    // this.light.target.position.set(0, 0, -5);
    
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
    
    const ratio = this.planeSize[1]/this.planeSize[0];
    const repeatTextX = 1;
    const planeGeom = new THREE.BoxGeometry(this.planeSize[0], 1, this.planeSize[1]);
    const planeMat = new THREE.ShaderMaterial({
      uniforms: {
        u_texture: {type: 't', value: groundText},
        u_alpha: {value: 0.5},
        u_multiplier: {value: 30},
        u_time: {value: 0},
        u_speed: {value: this.groundSpeed},
        u_texture: {value: groundText},
        u_repeatText: {value: new THREE.Vector2(repeatTextX, ratio*repeatTextX)},
      },
      vertexShader: plane_vs,
      fragmentShader: plane_fs,
    });
    this.plane = new THREE.Mesh(planeGeom, planeMat);
    this.plane.position.set(0, -1, 0);
    this.plane.name = "ground";
    this.groupAll.add(this.plane);
    this.plane.receiveShadow = true;



    //PLAYER OBJECT
    const dinoText = new THREE.TextureLoader().load('models/dinosaur/textures/Dino_baseColor.jpeg');
    dinoText.flipY = false; //needed for gltf models

    //player shaders uniforms
    this.playerUniforms = {
      u_time: {value: this.clock.getElapsedTime()},
      u_texture: {type: 't', value: dinoText},
      shininess: {type: 'f', value: 5}, //0 to 100 ,def 5
      lightDir: {type: 'v3', value: this.light.position}, //passed by reference.. so no need to update during time
      lightInt: {type: 'f', value: this.light.intensity},
      ambientInt: {type: 'f', value: this.ambientLight.intensity},
      specularInt: {type: 'f', value: 0.3}, //material property ,def 0.3
    };
    

    //player custom shader
    const playerMaterial = new THREE.ShaderMaterial({
      wireframe: false,
      uniforms: this.playerUniforms,
      vertexShader: player_vs,
      fragmentShader: player_fs,
    });

    /* const playerMaterial = new THREE.MeshPhongMaterial({
      map: dinoText,
      shininess: 100,
      specular: 0xffffff,
    }); */

    this.player = await this.loadPlayer();
    this.player.traverse((child) => {
      if(child.isMesh){
        child.material = playerMaterial;
        child.castShadow = true;
      }
    });
    this.player.name = "player";
    this.groupAll.add(this.player);

    this.player.scale.set(0.4,0.4,0.4);
    this.player.rotation.y = Math.PI;
    this.player.position.set(0,0.15,3);

    this.controls.target = this.player.position.clone(); //otherwise player moves
    


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



  update() {
    this.stats.update();
    //this.controls.update(); // needed only if controls.enableDamping or if controls.autoRotate = true
    //getDelta always before getElapsedTime and invokate only once

    
    if (this.gameState == "started"){
      const delta = this.clock.getDelta();
      // this.light.position.x = 8*Math.sin(this.clock.getElapsedTime()); //debugging-----------------
      // this.groupAll.rotateY(0.005);
      const elapsedTime = this.clock.getElapsedTime();
      Events.setTimer(elapsedTime);
      this.playerUniforms.u_time.value = elapsedTime /* % (1/this.groundSpeed) */;
      this.cactusUniforms.u_time.value = elapsedTime /* % (1/this.groundSpeed) */;      
      this.plane.material.uniforms.u_time.value = elapsedTime % (1/this.groundSpeed); // to fix precision problem in shader when time is too big
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
    this.obstacles.forEach((obstGroup) => {
      obstGroup.children.forEach((obst) => {
        /* if(this.checkCollision({obj1: this.player, obj2: obst})){
          Events.gameOver(this);
        } */
      });
    });
  }

  checkCollision({obj1, obj2}){
    const boundBoxPlr = new THREE.Box3().setFromObject(obj1);
    const boundBoxObst = new THREE.Box3().setFromObject(obj2);

    const shrinkVecPlayer = new THREE.Vector3(-0.1, -0.1, -0.2);
    //shrink bounding box to make it more accurate
    boundBoxPlr.expandByVector(shrinkVecPlayer);

    /* if (this.children.find((child) => child.name == "plrBox")){
      this.remove(this.children.find((child) => child.name == "plrBox"));
    } */

    const sizePlr = new THREE.Vector3();
    boundBoxPlr.getSize(sizePlr);
    const geomPlr = new THREE.BoxGeometry(sizePlr.x, sizePlr.y, sizePlr.z);
    const matPlr = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
    const plrBox = new THREE.Mesh(geomPlr, matPlr);
    plrBox.name = "plrBox";
    plrBox.position.set(this.player.position.x, this.player.position.y+0.2, this.player.position.z);
    // this.add(plrBox);

    const shrinkVecObst = new THREE.Vector3(-0.1, -0, -0.1);
    boundBoxObst.expandByVector(shrinkVecObst);

    const size = new THREE.Vector3();
    boundBoxObst.getSize(size);
    const geomObst = new THREE.BoxGeometry(size.x, size.y, size.z);
    const matObst = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
    const obstBox = new THREE.Mesh(geomObst, matObst);
    obstBox.name = "obstBox";
    
    //convert to world coordinates
    const vec = new THREE.Vector3(obj2.position.x, obj2.position.y, obj2.position.z);
    const obj2Pos = obj2.localToWorld(vec)
    obstBox.position.set(obj2Pos.x, obj2Pos.y + 0.9, obj2Pos.z);

    if (boundBoxPlr.intersectsBox(boundBoxObst)){
      this.groupAll.add(obstBox);
      this.groupAll.add(plrBox);  
    }

    return boundBoxPlr.intersectsBox(boundBoxObst);
  }
  
  movePlayer(delta){
    // this.player.children[0].rotation.z += 0.1;
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

    const gltfLoader = new GLTFLoader();
    const cactus = (await gltfLoader.loadAsync('models/cactus/10436_Cactus_v1_max2010_it2.gltf')).scene;

    cactus.scale.set(0.007, 0.007, 0.007);
    cactus.rotation.x = -Math.PI/2;


    this.cactusUniforms = {
      u_time: {value: this.clock.getElapsedTime()},
      u_texture: {type: 't', value: cactusTexture},
      shininess: {type: 'f', value: 1}, //0 to 100
      lightDir: {type: 'v3', value: this.light.position}, //passed by reference.. so no need to update during time
      lightInt: {type: 'f', value: this.light.intensity},
      ambientInt: {type: 'f', value: this.ambientLight.intensity},
      specularInt: {type: 'f', value: 0.1}, //material property
    };


    const cactusMaterial = new THREE.ShaderMaterial({
      wireframe: false,
      uniforms: this.cactusUniforms,
      vertexShader: obstacle_vs,
      fragmentShader: obstacle_fs,
      
    });

    cactus.traverse((child) => {
      if(child.isMesh){
        // child.material.map = cactusTexture; //meshbasicmaterial
        child.material = new THREE.MeshPhongMaterial({
          map: cactusTexture,
          shininess: 100,
          specular: 0x999999,


        });
        child.material = cactusMaterial;
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

    const options = {
      orbitsControls: false,
      threeShader: false,
    }

    this.gui.add(options, "orbitsControls").onChange((value) => {
      if(value){
        this.controls.enabled = true;
        this.controls.update();

      }else{
        this.camera.position.set(this.player.position.clone().x, 3, 6);
        this.camera.lookAt(new THREE.Vector3(this.player.position.clone().x, 0, 0));
        this.controls.enabled = false;
      }
    });
    this.gui.add(options, "threeShader").onChange((value) => {
      if (value){
        this.player.traverse((child) => {
          if(child.isMesh){
            child.material = new THREE.MeshPhongMaterial({
              map: this.playerUniforms.u_texture.value,
              shininess: 100,
              specular: 0xffffff,
            });
          }
        });
        this.cactus.traverse((child) => { //also existing cactus
          if(child.isMesh){
            child.material = new THREE.MeshPhongMaterial({
              map: this.cactusUniforms.u_texture.value,
              shininess: 100,
              specular: 0x999999,
            });
          }
        });
      }
    });
      
  }


}
