// varying vec3 pos; // if need to change color based on position
varying vec2 vUv;
varying vec3 normalInterp;
varying vec3 posMV; //position in model view space (for computing camera direction in fragment shader)

uniform float u_time;
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
  normalInterp = normalize( normalMatrix * normal );
  // projectionMatrix, modelVievMatrix, position are already passed in from Three.js,
  // also modelMatrix, viewMatrix, normalMatrix and cameraPosition (in worldSpace)
  // and normal and uv

  vUv = uv; // uv is built-in

  float oscillationX = 0.01 * sin(u_time * 20.0); // Speed can be adjusted by changing the multiplier
  float oscillationZ = 0.01 * sin(u_time * 40.0); // double the speed of oscillationX
  vec3 startPosition = vec3(
      position.x + oscillationX *(-3.0),  // scale again because oscillationX is used to rotate below
      position.y /* + sin( u_time * 5.0)/10.0 */, 
      position.z + oscillationZ *(-3.0)
  );

  //rotate
  vec3 endPosition = rotateY(oscillationX) * startPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(endPosition, 1.0);

  //posMV for computing camera direction in fragment shader
  posMV = (modelViewMatrix * vec4(position, 1.0)).xyz;
  


}