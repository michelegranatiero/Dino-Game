varying vec3 pos;
uniform float u_time;
varying vec2 vUv;

void main() {
  // projectionMatrix, modelVievMatrix, position are already passed in from Three.js,
  vUv = uv; // uv is a built-in attribute of Three.js
  vec4 result;
  pos = position;

  result = vec4(position, 1.0);
  // result = vec4(position.x, 4.0*sin(position.z/4.0) + position.y, position.z, 1.0);
  // result = vec4(position.x, position.y + sin(u_time), position.z, 1.0);
  // result = vec4(position.x, 4.0*sin(position.z/4.0 + u_time*10.0) + position.y, position.z, 1.0);
  result = vec4(
    position.x, 
    sin(position.z/3.0 + u_time*5.0) + sin(position.x/3.0 + u_time*5.0) + position.y, 
    position.z, 
    1.0
  );

  gl_Position = projectionMatrix * modelViewMatrix * result;
  


}