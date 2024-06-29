varying vec3 vColor;
uniform sampler2D u_texture;
varying vec2 vUv;

void main() {
  //gl_FragColor = vec4(vColor, 1.0);

  vec4 color = texture2D(u_texture, vUv);
  gl_FragColor = vec4(color);
}