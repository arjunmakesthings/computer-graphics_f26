#version 300 es
precision highp float;
in vec3 v_pos;
out vec4 frag_col;

//focal length:
float f = 3.0;

uniform float u_time;

//to keep track of what was hit:
int hit_piece = 0; 

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

//to get coefficients, we need to solve for a, b, c from the matrix we define for the shape. so; helper:
vec2 ray_quadric(vec3 v, vec3 w, mat4 s) {
  vec4 v_4 = vec4(v, 1.0);
  vec4 w_4 = vec4(w, 0.0);

  float a = dot(w_4, s * w_4);
  float b = dot(v_4, s * w_4) + dot(w_4, s * v_4);
  float c = dot(v_4, s * v_4);

  //small check to avoid parallel ray:
  if(a == 0.0) {
    //ray runs parallel to this piece:
    if(c <= 0.0) {
      //inside:
      return vec2(-1000., 1000.);
    } else {
      //outside:
      return vec2(-1.);
    }
  }

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
vec2 ray_shape(vec3 v, vec3 w, mat4 s[4], int intersections) {
  float enter = -1000.0;
  float exit = 1000.0;

  for(int i = 0; i < intersections; i++) {
    vec2 t = ray_quadric(v, w, s[i]);

    if(t.y < 0.0) {
      //ray missed the shape.
      return vec2(-1.0);
    }

    if(t.x > enter) {
      //take the last possible value:
      enter = t.x;
      hit_piece = i;
    }

    if(t.y < exit) {
      //take the first value:
      exit = t.y;
    }
  }

  if(enter > exit) {
    return vec2(-1.0);
  } else {
    return vec2(enter, exit);
  }

}

vec3 get_normal(vec3 p, mat4 s) {
  vec4 n = (s + transpose(s)) * vec4(p, 1.0);
  return normalize(n.xyz);
}

void main() {
  //slabs:
  mat4 slab_x = mat4(1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1);
  mat4 slab_y = mat4(0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1);
  mat4 slab_z = mat4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1);

  //cube:
  mat4 s[4];
  s[0] = slab_x;
  s[1] = slab_y;
  s[2] = slab_z;

  //ray stuff:
  vec3 v = vec3(0., 0., 5.);
  vec3 w = normalize(vec3(v_pos.xy, -f));

  //spin everything around the cube:
  float c = cos(u_time); 
  float sn = sin(u_time);

  //rot matrix:
  mat3 r = mat3(c, 0, -sn, 0, 1, 0, sn, 0, c);
  v = r * v;
  w = r * w;

  vec2 t = ray_shape(v, w, s, 3);

  frag_col = vec4(vec3(0.), 1.0);

  //only look at entry:
  if(t.x > 0.0) {
    vec3 p = v + t.x * w;
    vec3 n = get_normal(p, s[hit_piece]);
    frag_col = vec4(n * 0.5 + 0.5, 1.0);
  }
}