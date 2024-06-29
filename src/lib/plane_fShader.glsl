precision mediump float;

varying vec2 vUv;
uniform float u_time;
uniform float u_speed;
uniform sampler2D u_texture;
uniform vec2 u_repeatText;

void main() {  

  //vec2 coords = vec2(vUv.x, mod(vUv.y + uTime*uSpeed,1.0)); //scrolling y
  vec2 coords = vec2(vUv.x, vUv.y + u_time*u_speed); //scrolling y

  // repeat texture and keep uv coords in 0-1 range with fract (scale)
  vec2 uv = mod(coords * u_repeatText, 1.0);

  // vec4 color = texture2D(u_texture, uv); //coors instead of vUv
  //or smooth with gradient (for mipmaps and anisotropic filtering?)
  vec2 smooth_uv = u_repeatText*coords;
  vec4 duv = vec4(dFdx(smooth_uv), dFdy(smooth_uv)); //derivative of uv
  vec4 color = textureGrad(u_texture, uv, duv.xy, duv.zw); //sample texture with gradient

  gl_FragColor = vec4(color.rgb, 1.0);

}