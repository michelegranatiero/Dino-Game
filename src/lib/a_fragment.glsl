varying vec3 pos;
uniform float u_time;

uniform sampler2D u_texture;
varying vec2 vUv;

void main() {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
  // gl_FragColor = vec4(abs(sin(u_time)), 0.0, 0.0, 1.0);

  /* if (pos.x >= 0.0){
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4(abs(sin(u_time)), 0.0, 0.0, 1.0);
  } else {
    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    // gl_FragColor = vec4(0.0, abs(cos(u_time)), 0.0, 1.0);
  } */


  /* if (pos.x >= 0.0 && pos.y >= 0.0 && pos.z >= 0.0){
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4(abs(sin(u_time)), 0.0, 0.0, 1.0);
  } */


  vec4 color = texture2D(u_texture, vUv);
  gl_FragColor = vec4(color);

}