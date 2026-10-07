#version 300 es
precision highp float;
in vec3 v_pos;
out vec4 frag_col;

//focal length:
float f = 3.;

vec4 s = vec4(0.0, 0.0, -3.0, 0.75); 

uniform float u_time;

//tracing a ray to a sphere: 
float ray_to_sphere(vec3 v, vec3 w, vec4 s) {
  v -= s.xyz; //position of camera relative to sphere. 
  float r = s.w; 

//need dot products for the equation (W•W) t2 + 2 (W•V) t + (V•V) - r2 = 0. 
//w is a unit length vector. 
  float vw = dot(v, w);
  float vv = dot(v, v); //length of itself. 

  float d = vw * vw - (vv - r * r);

  if(d < 0.) {
    return -1.0;
  } else {
    //hit the circle
    return -vw - sqrt(d);
  }
}

void main() {
  vec3 pos = v_pos;
  frag_col = vec4(vec3(0.0), 1.); 

  //parameters for ray:
  vec3 v = vec3(0.0);
  vec3 w = normalize(vec3(pos.xy, -f));
  float t = ray_to_sphere(v, w, s);

  if(t >= 0.0) {
    //inside the sphere:

    //find point on sphere surface:
    vec3 p = v + t * w; 

    //light pos:
    vec3 l_pos = vec3(sin(u_time), 1.0, cos(u_time) - 1.0); 

    //surface normal:
    vec3 n = normalize(p - s.xyz); 

    //distance between light position & point: 
    vec3 d = normalize(l_pos - p);

    //light color:
    vec3 surface = vec3(1.0, 0.0, 1.0);
    vec3 ambient = .09 * surface; 

    //diffuse using lambert's cosine:
    float diffuse = max(0., dot(n,d)); 

    //specular:
    vec3 reflected_light = 2. * dot(n,d) * n - d; 
    float shininess = 10.0; 

    vec3 spec_col = vec3(1.0, 0.4, 1.0);

    //if you don't take max, you get negative (powers turn negatives positive): 
    vec3 spec = pow(max(0., dot(-w, reflected_light)), shininess) * spec_col; 

    //combine lighting:
    vec3 c = (ambient + diffuse * surface) + spec; 

    //output with gamma correction:
    frag_col = vec4(sqrt(c), 1.0); 
  }
}