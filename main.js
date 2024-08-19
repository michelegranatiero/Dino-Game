import * as THREE from "three";
import GameScene from "./src/GameScene";
import * as Events from "./src/Events.js";

const width = window.innerWidth;
const height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
});
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.shadowMap.enabled = true;

let scene;
let mainCamera;

newScene();

animate();


//audio
let AUDIO_IS_ON = false;
const audio = new Audio("sounds/collisionSound.mp3");

let audioContext
let audioBuffer;
let audioSource;



/////////////////////////FUNCTIONS//////////////////////////////

function newScene(){
  mainCamera = new THREE.PerspectiveCamera( 90, width / height, 0.1, 1000);
  
  scene = new GameScene();
  scene.initialize(mainCamera, renderer);
}

function animate() {
  scene.update();
  renderer.render(scene, mainCamera);
  
  requestAnimationFrame(animate);
}



/////////////////////////LISTENERS//////////////////////////////

// responsive window resizing
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  mainCamera.aspect = window.innerWidth / window.innerHeight;
  mainCamera.updateProjectionMatrix();
});

// play button listeners
document.getElementById("playButton").onclick = async() => {
      document.getElementById("playButton").disabled = false;
  if (!["ready", "gameover", "paused"].includes(scene.gameState)) return;
  audio.currentTime = 0;
  audio.pause();
  if (!audioContext){
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await loadAudio();    
  }

  Events.gameStart(scene);
  if (AUDIO_IS_ON) {
    audioContext.resume().then(() => {   
      console.log("wewe");
         
      playLoop();
    });
    window.speedDefaultSound();
  }else if (audioSource){
    audioSource.stop();
  }
};

document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ")) {
  
    event.preventDefault();
    if (!(document.getElementById("playButton").classList.contains("hovered"))) {
      document.getElementById("playButton").classList.add("hovered");
    }

  }
});

document.addEventListener("keyup", (event) => {
  if ((event.key === "Enter" || event.key === " ")
    && ["gameover", "paused", "ready"].includes(scene.gameState)) {
    event.preventDefault();
    if (document.getElementById("playButton").classList.contains("hovered")) {
      document.getElementById("playButton").classList.remove("hovered");
    }
    
    document.getElementById("playButton").click();
  }
});

// pause button listener
document.getElementById("pauseButton").onclick = () => {
  Events.pauseGame(scene);
};

//FOV radios listener
document.getElementById("fov-far").onclick = () => {
  mainCamera.fov = 115;
  mainCamera.updateProjectionMatrix();
};

document.getElementById("fov-normal").onclick = () => {
  mainCamera.fov = 90;
  mainCamera.updateProjectionMatrix();
}

document.getElementById("fov-close").onclick = () => {
  mainCamera.fov = 75;
  mainCamera.updateProjectionMatrix();
}

//shader checkbox listener
document.getElementById("shader").onclick = () => {
  //check if checkbox is checked
  const checked = document.getElementById("shader").checked;
  scene.threeShaderCallback(checked);
  scene.GUIoptions.threeShader = checked;
  scene.shaderGUIController.updateDisplay();
}

/////////////////AUDIO////////////////////
async function loadAudio() {
  const response = await fetch('sounds/stepsRun.mp3');
  const data = await response.arrayBuffer();
  audioBuffer = await audioContext.decodeAudioData(data);
}

function playLoop() {    
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.loop = true;
    let gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;
    audioSource.connect(gainNode);
    gainNode.connect(audioContext.destination);
    //audioSource.connect(audioContext.destination); //without gain node
    audioSource.start(0);
}

window.stopSound = () => {
  if (audioSource) {
    //pause audio
    audioSource.stop();
  }
}

window.speedUpSound = () => {
  if (audioSource) {
    audioSource.playbackRate.value = 1.5;
  }
}

window.speedDefaultSound = () => {
  if (audioSource) {
    audioSource.playbackRate.value = 1;
  }
}

window.playCollisionSound = () => {
  if (AUDIO_IS_ON) audio.play();
}

document.getElementById("audioButton").onclick = () => {
  AUDIO_IS_ON = !AUDIO_IS_ON;
  if (AUDIO_IS_ON) {
    document.getElementById("sound-on-icon").style.display = "block";
    document.getElementById("sound-off-icon").style.display = "none";
  } else {
    //window.stopSound();
    document.getElementById("sound-on-icon").style.display = "none";
    document.getElementById("sound-off-icon").style.display = "block";
  }
}
