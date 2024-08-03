precision mediump float; //default should be highp

varying vec2 vUv;
uniform sampler2D u_texture;

varying vec3 normalInterp;
varying vec3 posMV;
uniform float shininess; // specular exponent (alpha)
uniform vec3 lightDir;

uniform float lightInt;
uniform float ambientInt;
uniform float specularInt;

void main() {

  
  // vec3 Kd = vec3(1.0, 1.0, 1.0); // diffuse coefficient (color/texture)
  // vec3 Id = vec3(1.0, 1.0, 1.0); // diffuse intensity
  vec3 Id = vec3(lightInt);
  
  vec3 Ks = vec3(1.0, 1.0, 1.0); // material property
  vec3 Is = vec3(specularInt); // specular intensity
  
  // vec3 Ka = vec3(1.0, 1.0, 1.0); // ambient coefficient (color/texture)
  // vec3 Ia = vec3(0.5, 0.5, 0.5); // ambient intensity
  vec3 Ia = vec3(ambientInt);
  
  
  vec3 Kd = texture2D(u_texture, vUv).rgb; // texture color
  vec3 Ka = texture2D(u_texture, vUv).rgb; // texture color
  

  vec3 N = normalInterp; // already normalized
  vec3 L = normalize((viewMatrix * vec4(lightDir, 0.0)).xyz); // light from world to view space 

  float lambertian = max(dot(N, L), 0.0); // cos(theta) or geometry term
  float specular = 0.0;

  if (lambertian > 0.0) {
    vec3 R = reflect(-L, N);	// reflected light direction
    vec3 V = normalize(-posMV); // camera direction
    // vec3 V = posMV;
    float specAngle = max(dot(R, V), 0.0); // cos(phi)
    specular = pow(specAngle, shininess);
  }

  vec3 ambient = Ka * Ia;
  vec3 diffuse = Kd * Id * lambertian;
  vec3 spec = Ks * Is * specular;

  vec3 color = ambient + diffuse + spec;
  gl_FragColor = vec4(color, 1.0);

}