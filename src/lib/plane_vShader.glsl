
varying vec2 vUv;

void main() {

  vUv = uv; // uv is a built-in attribute of Three.js
  vec3 pos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

}