#version 300 es
precision highp float;
in vec3 v_pos;
out vec4 frag_col;

//focal length:
float f = 3.0; 

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

//to get coefficients, we need to solve for a, b, c from the matrix we define for the shape. so; helper:
vec2 ray_quadric(vec3 v, vec3 w, mat4 s) {
  vec4 v_4 = vec4(v, 1.0);
  vec4 w_4 = vec4(w, 0.0);

  float a = dot(w_4, s * w_4);
  float b = dot(v_4, s * w_4) + dot(w_4, s * v_4);
  float c = dot(v_4, s * v_4);

  float touch = b * b - 4. * a * c;

  if(touch < 0.0) {
    //missed:
    return vec2(-1.);
  } else {
    //hit:
    float t1 = (-b - sqrt(touch)) / (2. * a);
    float t2 = (-b + sqrt(touch)) / (2. * a);
    return vec2(t1, t2);
  }
}

//generic ray-tracing function:
vec2 ray_shape(vec3 v, vec3 w, mat4 s[4], int cde) {
  float enter = 0.0;
  float exit = 1.0;
  return vec2(0.);
}

void main() {
  //sphere as matrix: 
  mat4 sphere = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1);

  //ray stuff:
  vec3 v = vec3(0., 0., 5.);
  vec3 w = normalize(vec3(v_pos.xy, -f));
  vec2 t = ray_quadric(v, w, sphere);

  frag_col = vec4(vec3(0.), 1.0);

  //only look at entry:
  if(t.x > 0.0) {
    frag_col = vec4(1.0);
  }

}