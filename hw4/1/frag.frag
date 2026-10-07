#version 300 es
precision highp float;
in vec3 v_pos;
out vec4 frag_col;

//focal length:
float f = 3.0; 

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

float ray_to_half_space(vec3 v, vec3 w, vec4 p) {
  //add homogenous coordinates:
  return (-dot(p, vec4(v, 1.0)) / dot(p, vec4(w, 0.0)));
}

void main() {
  vec3 pos = v_pos;
  frag_col = vec4(vec3(0.0), 1.); 

  //define half-space:
  float mv = sin(u_time);
  vec4 plane = vec4(0.0, 1.0, 0.0, mv);

    //parameters for ray:
    vec3 v = vec3(0.0);
    vec3 w = normalize(vec3(pos.xy, -f));
    float t = ray_to_half_space(v, w, plane);

  if(dot(plane, vec4(v, 1.0)) > 0.0) {
    //ray origin is outside halfspace:
    if(t < 0.0) {
      //ray missed it. 
      frag_col = vec4(vec3(0.0), 1.0);
    } else if(t > 0.0) {
      //ray is entering halfspace at point v + tw. 
      frag_col = vec4(1.0);
    }
  } else {
    //ray origin is inside the halfspace:
    if(t < 0.0) {
      //ray inside the halfspace. 
      frag_col = vec4(1.0);
    } else if(t > 0.0) {
      //ray is exiting at point v + tw.
      frag_col = vec4(vec3(1. / t), 1.0);
    }
  }

}