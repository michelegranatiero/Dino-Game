// varying vec3 pos; // if need to change color based on position
varying vec2 vUv;
varying vec3 normalInterp;
varying vec3 posMV; //position in model view space (for computing camera direction in fragment shader)

uniform float u_time;
// uniform vec4 u_wasd;

mat3 rotateX(float angle) {
  return mat3(
    1, 0, 0,
    0, cos(angle), -sin(angle),
    0, sin(angle), cos(angle)
  );
}

mat3 rotateY(float angle) {
  return mat3(
    cos(angle), 0, sin(angle),
    0, 1, 0,
    -sin(angle), 0, cos(angle)
  );
}

mat3 rotateZ(float angle) {
  return mat3(
    cos(angle), -sin(angle), 0,
    sin(angle), cos(angle), 0,
    0, 0, 1
  );
}

void main() {
  // projectionMatrix, modelVievMatrix, position are already passed in from Three.js,
  // also modelMatrix, viewMatrix, normalMatrix and cameraPosition (in worldSpace)
  // and normal and uv

  vUv = uv; 
  normalInterp = normalize( normalMatrix * normal );

  //posMV for computing camera direction in fragment shader
  posMV = (modelViewMatrix * vec4(position, 1.0)).xyz;



  //HERE X IS LEFT, Y IS DEPTH FACING SCREEN,Z IS UP
  //movement
  float oscillationX = 0.4 * sin(u_time * 2.0); // Speed can be adjusted by changing the multiplier
  vec3 startPosition = vec3(
      position.x /* + oscillationX *(1.0) */ + exp2(0.015*position.z)*sin(u_time*10.0)*1.0, 
      position.y , 
      position.z 
  );

  //rotate
  vec3 endPosition = /* rotateY(oscillationX) * */ startPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(endPosition, 1.0);
  


}