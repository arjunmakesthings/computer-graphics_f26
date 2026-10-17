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

//noise: 
//given a set of 3 numbers, return a random set of 3. same input yields same output. hash is borrowed from ken.
vec3 hash(vec3 c) {
  return cos(5. * (c + 5. * cos(5. * (c.yzx + 5. * cos(5. * (c.zxy + 5. * cos(5. * c)))))));
}

//drop-off function. ranges from 0 to 1 as t goes from 0 to 1.
float drop(float t) {
  t = abs(t);
  return 1. - t * t * (3. - 2. * t);
}

float noise(vec3 p) {
  vec3 cell = floor(p); //find closest cube-corner in an infinite grid of cubes. 
  float sum = 0.;

//for each of the 8 corners of the cube: 
  for(int a = 0; a < 2; a++) {
    for(int b = 0; b < 2; b++) {
      for(int c = 0; c < 2; c++) {
        vec3 corner = cell + vec3(a, b, c);
        vec3 g = normalize(hash(corner));
        vec3 d = p - corner; //directional arrow from the corner to the point.
        float w = drop(d.x) * drop(d.y) * drop(d.z);
        sum += dot(g, d) * w;
      }
    }
  }

  return sum;
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

    //float ns = noise(8. * (p - s.xyz)) * u_time;

    float ns = noise(6. * (p)); 
    vec3 surface = vec3(1., 0., 1.) * (.5 + ns);

    frag_col = vec4(vec3(ns), 1.0);
  }
}