#version 300 es
precision highp float;
in vec3 v_pos;
out vec4 frag_col;

//passed uniforms:
uniform float u_time;

//frag variables:

//focal length:
float f = 3.0;

//memory to keep track of what was hit:
int hit_piece = 0; 

//ray-trace stuff:

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

  vec3 surface = vec3(1.0, 0.0, 1.0);
  vec3 ambient = 0.09 * surface;

  //lambert's cosine:
  float diffuse = max(0., dot(n, d));

  vec3 c = ambient + diffuse * surface;

  //specular:
  //for this, we first need a reflection of the light direction about the normal:
  vec3 reflected_light = 2. * dot(n, d) * n - d;

  float shininess = 10.;

  vec3 spec_col = vec3(1.0, 0.4, 1.0);

  vec3 spec = pow(max(0., dot(-w, reflected_light)), shininess) * spec_col;
  c += spec;

  return c;
}

void main() {
  //sphere-definition:
  mat4 s[4];
  s[0] = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1); 

  //ray stuff:
  vec3 v = vec3(0., 0., 4.);
  vec3 w = normalize(vec3(v_pos.xy, -f));

  vec2 t = ray_shape(v, w, s, 1);

  frag_col = vec4(vec3(0.), 1.0);

  //light:
  //vec3 l_pos = vec3(-1.0, 0.0, 2.0 +  2.0 * cos(u_time));
  vec3 l_pos = vec3(sin(u_time), 1.0, 2.0 + cos(u_time));

  //only look at entry:
  if(t.x > 0.0) {
    vec3 p = v + t.x * w;
    vec3 n = get_normal(p, s[hit_piece]);
    frag_col = vec4(sqrt(shade(p, n, w, l_pos)), 1.);
  }
}

/*
shape matrix definitions, by ken: 

Sphere

  xx + yy + zz ≤ 1  ⟶   [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1 ]
Cylindrical tube

  yy + zz ≤ 1  ⟶   [ 0,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1 ]        // Tube in X
  xx + zz ≤ 1  ⟶   [ 1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1 ]        // Tube in Y
  xx + yy ≤ 1  ⟶   [ 1,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1 ]        // Tube in Z
Slab

  xx ≤ 1  ⟶   [ 1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,-1 ]             // Slab in X
  yy ≤ 1  ⟶   [ 0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1 ]             // Slab in Y
  zz ≤ 1  ⟶   [ 0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1 ]             // Slab in Z
Cone

  -xx + yy + zz ≤ 0  ⟶   [ -1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,0 ]   // Cone in X
  xx - yy = zz ≤ 0  ⟶   [ 1,0,0,0, 0,-1,0,0, 0,0,1,0, 0,0,0,0 ]   // Cone in Y
  xx + yy - zz ≤ 0  ⟶   [ 1,0,0,0, 0,1,0,0, 0,0,-1,0, 0,0,0,0 ]   // Cone in Z
*/
