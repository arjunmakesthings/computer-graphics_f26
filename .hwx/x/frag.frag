#version 300 es
precision highp float;
in vec3 v_pos;
out vec4 frag_col;

//focal length:
float f = 3.;

vec4 s = vec4(0.0, 0.0, -3.0, 0.75); 

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
    vec3 l_pos = vec3(-1.0, -1.0, -2.0); 

    //surface normal:
    vec3 n = normalize(p-s.xyz); 
  }
}