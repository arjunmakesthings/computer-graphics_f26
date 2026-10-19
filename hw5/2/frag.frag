#version 300 es
precision highp float;
in vec3 v_pos;
out vec4 frag_col;

//focal length:
float f = 3.;

//to keep track of what was hit:
int hit_piece = 0;

uniform float u_time;

//ray trace stuff:
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
//helper to get normal:
vec3 get_normal(vec3 p, mat4 s) {
  vec4 n = (s + transpose(s)) * vec4(p, 1.0);
  return normalize(n.xyz);
}

//helper to shade:
vec3 shade(vec3 p, vec3 n, vec3 w, vec3 l_pos) {
  //direction from point to light:
  vec3 d = normalize(l_pos - p);

  vec3 surface = vec3(0.08, 0.0,  0.5);
  vec3 ambient = surface * 8.0;

  //lambert's cosine:
  //float diffuse = max(0., dot(n, d));
  float diffuse = max(0., dot(n, d));

  vec3 c = ambient + diffuse * surface;

  //specular:
  //for this, we first need a reflection of the light direction about the normal:
  vec3 reflected_light = 2. * dot(n, d) * n - d;

  float shininess = 10.;

  vec3 spec_col = vec3(1.0);

  vec3 spec = pow(max(0., dot(-w, reflected_light)), shininess) * spec_col;
  c += spec;

  return c;
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
  //hyperboloid:
  mat4 s[4];
  s[0] = mat4(0.75, 0, 0, 0, 0, -5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5);
  s[1] = mat4(0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -3);

  //ray stuff:
  vec3 v = vec3(0., 0., 4.);
  vec3 w = normalize(vec3(v_pos.xy, -f));

  vec2 t = ray_shape(v, w, s, 2);

  frag_col = vec4(vec3(0.), 1.0);

  //light:
  vec3 l_pos = vec3(-1.0, 0.0, -5.0) * 0.5;

  //only look at entry:
  if(t.x > 0.0) {
    vec3 p = v + t.x * w;

    vec3 n = get_normal(p, s[hit_piece]);
    vec4 col = vec4(sqrt(shade(p, n, w, l_pos)), 1.);
    float r = 2. * noise(p - l_pos * u_time) * u_time;

    col.r -= r;

    frag_col = vec4(vec3(col), 1.0);
  }
}
