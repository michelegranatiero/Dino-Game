export function createGrid(){
  let divisions = 30;
  let gridLimit = 50;
  //this.groundSpeed = 2.0;
  this.grid = new THREE.GridHelper(gridLimit*2, divisions, 0x00ff00, 0x00ff00);

  const moveableZ = [];
  for (let i = 0; i <= divisions; i++) { //move horizontal lines only (1 means point is moveable)
    moveableZ.push(1,1,0,0);
  }

  this.grid.geometry.setAttribute('moveableZ', new THREE.BufferAttribute(new Float32Array(moveableZ), 1));

  const groundText = new THREE.TextureLoader().load('textures/groundTextureCartoon.jpg');

  this.grid.material = new THREE.ShaderMaterial({
    uniforms: {
      speedZ: {value: this.groundSpeed},
      gridLimits: {value: new THREE.Vector2(-gridLimit, gridLimit)},
      time: {value: 0},
      u_texture: {type: 't', value: groundText},
    },
    vertexShader: ground_vs,
    fragmentShader: ground_fs,
    vertexColors: true
  });
  this.add(this.grid);
  this.grid.position.set(0, -0.5, 0);
}