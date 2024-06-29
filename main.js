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
//renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setPixelRatio(window.devicePixelRatio);
//renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;

let scene;
let mainCamera;

newScene();

animate();


//audio
let AUDIO_IS_ON = false;
const audio = new Audio("sounds/stepsRun.mp3");

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioBuffer;
let audioSource;

loadAudio();

/////////////////////////FUNCTIONS//////////////////////////////

function newScene(){
  mainCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  
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
document.getElementById("playButton").onclick = () => {
  Events.gameStart(scene);
  if (AUDIO_IS_ON) {
    audioContext.resume().then(() => {
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

/////////////////AUDIO////////////////////
function loadAudio() {
  fetch('sounds/stepsRun.mp3')
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(decodedData => {
        audioBuffer = decodedData;
    });
}

function playLoop() {
    audio.play(); //needed for unlock audio on ios devices
    audio.pause();
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
