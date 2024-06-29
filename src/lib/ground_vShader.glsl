uniform float time;
uniform vec2 gridLimits;
uniform float speedZ;

attribute float moveableZ;

varying vec3 vColor;
varying vec2 vUv;

void main() {
  
  vColor = color;
  vUv = uv; // uv is a built-in attribute of Three.js
  
  float limLen = gridLimits.y - gridLimits.x;
  vec3 pos = position;
  if (floor(moveableZ + 0.5) > 0.5){
    float zDist = speedZ * time;
    float curZPos = mod((pos.z + zDist) - gridLimits.x, limLen) + gridLimits.x;
    pos.z = curZPos;
  }
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

}