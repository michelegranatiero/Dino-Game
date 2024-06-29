
export function gameReady(scene){
  scene.gameState = "ready";
  document.getElementById("frame").style.backgroundColor = "rgba(0, 91, 152, 0.8)";
  document.getElementById("playButton").style.opacity = "1";
  document.getElementById("audioButton").style.opacity = "1";
  document.getElementById("timer").style.opacity = "1";
  document.getElementById("loader").style.display = "none";
  // remove transitions after intro screen
  document.getElementById("frame").addEventListener("transitionend", (event) => {
    if (event.propertyName == "background-color"){
      document.getElementById("frame").style.transition=  "none";
      document.getElementById("playButton").style.transition=  "none";
      document.getElementById("timer").style.transition=  "none";
    }
  });
}

export function gameStart(scene){
  //reset the scene
  if (scene.gameState == "gameover") reset(scene);

  scene.clock.start();
  
  if (scene.gameState == "paused") {
    scene.clock.elapsedTime = scene.savedElapsedTime;
  }

  scene.gameState = "started";
  
  document.getElementById("frame").style.backgroundColor = "rgba(0, 0, 0, 0)";
  document.getElementById("container").style.visibility = "hidden";
  document.getElementById("pauseButton").style.display = "flex"
}

export function gameOver(scene){
  scene.gameState = "gameover";
  scene.clock.stop();
  window.stopSound();
  document.getElementById("frame").style.background = "rgba(0, 0, 0, 0.5)";
  document.getElementById("container").style.visibility = "visible";
  document.getElementById("playButton").innerHTML = "Play Again";
  document.getElementById("gameText").innerHTML = "Game Over";
  document.getElementById("pauseButton").style.display = "none"
}

export function reset(scene){
  //reset scene (variables, listeners, etc)
  //remove obstalces
  scene.obstacles.forEach((obstGroup) => {
    obstGroup.children.forEach((obst) => {
      scene.groupAll.remove(obst);
    });
    scene.groupAll.remove(obstGroup);
  });
  for (let i = scene.groupAll.children.length - 1; i >= 0; i--) { //from last to first otherwise it will skip some elements
    const child = scene.groupAll.children[i];
    if (child.name === "obstBox" || child.name === "plrBox") {
      scene.groupAll.remove(child);
    }
  }
  
  scene.obstacles = [];
  scene.lastSpawnTime = 0;
  scene.player.position.set(0,0.15,3);
  scene.camera.position.set(0, 3, 6);
  scene.savedElapsedTime = 0;
}

export function setTimer(elapsedTime){
  document.getElementById("timer").innerHTML = elapsedTime.toFixed(2);
}

export function pauseGame(scene){
  if (scene.gameState != "started") return;
  
  scene.gameState = "paused";
  window.stopSound();

  scene.savedElapsedTime = scene.clock.getElapsedTime();
  scene.clock.stop();

  document.getElementById("frame").style.background = "rgba(0, 0, 0, 0.5)";
  document.getElementById("container").style.visibility = "visible";
  document.getElementById("playButton").innerHTML = "Resume";
  document.getElementById("gameText").innerHTML = "Game Paused";
  document.getElementById("pauseButton").style.display = "none";  
}

////////////////////////////////////////////////////////////////
/////////////////////////LISTENERS//////////////////////////////
////////////////////////////////////////////////////////////////

export function gamePausedListener(scene){
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState == "hidden"){
       pauseGame(scene);
    }
  });
}

const keyList = ["a", "d", "arrowleft", "arrowright"/* , "w", "s", "arrowdown", "arrowup" */];
export function addKeysListener(keysDict){
  window.addEventListener("keydown", (e) => {
    if (keyList.includes(e.key.toLowerCase())) {
      keysDict[e.key.toLowerCase()] = true;
      window.speedUpSound();
    }
  }, false);
  window.addEventListener("keyup", (e) => {
    if (keyList.includes(e.key.toLowerCase())) {
      keysDict[e.key.toLowerCase()] = false;
      window.speedDefaultSound();
    }
  }, false);
}

export function addTouchListeners(keysDict){
  const canvas = document.getElementById("canvas");
  canvas.addEventListener("touchstart", (e) => {
    //check if left or right side of the screen    
    e.preventDefault();
    //empty the keysDict
    Object.keys(keysDict).forEach(key => delete keysDict[key]);
    const changedTouchX = e.changedTouches[e.changedTouches.length-1].clientX;
    window.speedUpSound();
    if (changedTouchX < window.innerWidth/2){
      keysDict["a"] = true;
    }else{
      keysDict["d"] = true;
    }
    
  }, false);

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    window.speedDefaultSound();
    const changedTouchX = e.changedTouches[0].clientX;
    if (changedTouchX < window.innerWidth/2){
      keysDict["a"] = false;
    }else{
      keysDict["d"] = false;
    }
    
    
  }, false);
}


export function guiVisibilityListener(gui, stats){
  window.visualViewport.addEventListener("resize", () => {
    if (window.visualViewport.width <= 800){
      gui.hide();
      stats.dom.style.visibility = "hidden";
    }
    else{
      gui.show();
      stats.dom.style.visibility = "visible";
    }
  });
}
