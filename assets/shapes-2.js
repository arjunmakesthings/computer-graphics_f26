/*
note: 

i wrote the first version of this — shapes.js — by hand. 

at this point (in week-11), i'd like to exploit more shapes. so, this library builds on what i'd written originally; but is written by claude (shape definitions). 
*/

/*
every make_* function returns a flat array of vertices, 3 vertices per triangle.
each vertex is 8 numbers:  x,y,z,  nx,ny,nz,  u,v
(position, normal, texture coordinate). so the stride is 8 floats.

shapes live in roughly the [-1,1] cube, z is "up" (same as the original sphere).

all available shapes (defaults in parentheses):

  quadrics
    make_sphere(n=20)                     make_ellipsoid(a=1, b=.6, c=.4, n=24)
    make_hemisphere(n=20)                 make_superellipsoid(e1=.4, e2=.4, n=32)
    make_cylinder(n=32)                   make_cone(n=32)
    make_frustum(r0=1, r1=.5, n=32)       make_capsule(n=24, h=.5, r=.5)
    make_torus(R=.7, r=.3, m=40, n=20)    make_paraboloid(n=32)
    make_hyperboloid(n=32)                make_saddle(n=24)
    make_catenoid(n=32)                   make_helicoid(n=48)

  flat
    make_plane(m=1, n=1)                  make_disk(n=32, z=0, dir=1, r=1)
    make_ring(r0=.5, n=32)                make_wave(k=3, A=.25, n=48)

  polyhedra
    make_box(a=1, b=1, c=1)               make_cube()
    make_tetrahedron()                    make_octahedron()
    make_icosahedron()                    make_dodecahedron()
    make_pyramid(n=4)                     make_prism(n=6)

  tubes and knots
    make_helix(turns=3, R=.6, r=.1)       make_torus_knot(p=2, q=3, r=.12)
    make_tube(C, r=.12, m=100, n=12)      (C = function t in [0,1] -> [x,y,z])

  strange surfaces
    make_mobius(n=80)                     make_klein(n=64)
    make_dini(n=64)

  text
    make_text(str)

  generic builders (for making your own)
    make_surface(P, m=32, n=32)           (P = function (u,v) in [0,1] -> [x,y,z])
    make_polyhedron(verts, faces)
*/


/* ---------------------------------------------------------------------------
   small vector helpers + the two generic builders everything else is made from
--------------------------------------------------------------------------- */

let _sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
let _cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
let _dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
let _normalize = (a) => { let l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// signed power: keeps the sign of x, so |x|^p works for negative x too.
let _spow = (x, p) => Math.sign(x) * Math.pow(Math.abs(x), p);


/*
make_surface: turn any parametric surface P(u,v), u and v in [0,1], into triangles.

  position = P(u,v)
  normal   = normalize( dP/du  x  dP/dv )
  uv       = (u,v)

algorithm:
  1. cut the (u,v) square into an m-by-n grid of little squares.
  2. for each little square, make 2 triangles.
  3. at each corner: position is P(u,v). for the normal, nudge u and v a tiny
     bit each way to get two tangent directions, and cross them.
     (corner values are clamped slightly inward so poles/apexes don't give 0).
  4. the texture coordinate is just (u,v).
*/
function make_surface(P, m = 32, n = 32) {
  let vs = [];
  let e = 1e-3;
  let clamp = (t) => Math.min(1 - 2 * e, Math.max(2 * e, t));

  let point = (u, v) => {
    let uc = clamp(u), vc = clamp(v);
    let du = _sub(P(uc + e, vc), P(uc - e, vc));
    let dv = _sub(P(uc, vc + e), P(uc, vc - e));
    return [...P(u, v), ..._normalize(_cross(du, dv)), u, v];
  };

  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) {
      let u0 = i / m, u1 = (i + 1) / m;
      let v0 = j / n, v1 = (j + 1) / n;
      vs.push(
        ...point(u0, v0), ...point(u1, v0), ...point(u1, v1),
        ...point(u0, v0), ...point(u1, v1), ...point(u0, v1),
      );
    }
  return vs;
}


/*
make_polyhedron: flat-shaded solid from a list of corner points and faces.
(corners must surround the origin and the solid must be convex.)

  face normal = normalize( (p1 - p0) x (p2 - p0) ), flipped if it points at the origin

algorithm:
  1. for each face (a list of corner indices going around the face):
  2. compute the normal from the first three corners; if it points toward the
     origin, reverse the face so it points outward.
  3. cut the face into a fan of triangles that all share corner 0.
  4. uv: a 4-corner face gets the unit square. any other face puts its k corners
     evenly on a circle inside the uv square (right for regular polygons).
*/
function make_polyhedron(verts, faces) {
  let vs = [];
  for (let face of faces) {
    let p = face.map(i => verts[i]);
    let c = [0, 1, 2].map(k => p.reduce((s, q) => s + q[k], 0) / p.length);
    let N = _normalize(_cross(_sub(p[1], p[0]), _sub(p[2], p[0])));
    if (_dot(N, c) < 0) { p.reverse(); N = N.map(x => -x); }

    let k = p.length;
    let uv = (i) => k == 4
      ? [[0, 0], [1, 0], [1, 1], [0, 1]][i]
      : [.5 + .5 * Math.cos(2 * Math.PI * i / k), .5 + .5 * Math.sin(2 * Math.PI * i / k)];

    for (let i = 1; i < k - 1; i++)
      for (let j of [0, i, i + 1])
        vs.push(...p[j], ...N, ...uv(j));
  }
  return vs;
}


/*
make_disk: flat circle, used on its own and as the caps of other shapes.

  x^2 + y^2 <= r^2,  z = z0

algorithm: a fan of n triangles, each from the center to two neighbouring points
on the rim. uv maps the circle into the uv square: (x,y) -> (x/2+.5, y/2+.5).
dir = +1 faces up (+z), dir = -1 faces down.
*/
function make_disk(n = 32, z = 0, dir = 1, r = 1) {
  let vs = [];
  let rim = (i) => [r * Math.cos(2 * Math.PI * i / n), r * Math.sin(2 * Math.PI * i / n)];
  let vert = (x, y) => [x, y, z, 0, 0, dir, .5 + x / r / 2, .5 + y / r / 2];
  for (let i = 0; i < n; i++) {
    let a = rim(i), b = rim(i + 1);
    if (dir > 0) vs.push(...vert(0, 0), ...vert(...a), ...vert(...b));
    else         vs.push(...vert(0, 0), ...vert(...b), ...vert(...a));
  }
  return vs;
}


/* ---------------------------------------------------------------------------
   quadrics (shapes with an implicit equation f(x,y,z) = 0)
--------------------------------------------------------------------------- */

/*
sphere:  x^2 + y^2 + z^2 = 1
  x = cos(theta) cos(phi),  y = sin(theta) cos(phi),  z = sin(phi)
  theta = 2 pi u (around),  phi = pi v - pi/2 (south pole to north pole)

algorithm: u sweeps once around the equator, v sweeps from bottom to top. every
(u,v) is one point on the surface. the normal of a unit sphere equals the position.
*/
function make_sphere(n = 20) {
  return make_surface((u, v) => {
    let theta = 2 * Math.PI * u, phi = Math.PI * v - Math.PI / 2;
    return [Math.cos(theta) * Math.cos(phi), Math.sin(theta) * Math.cos(phi), Math.sin(phi)];
  }, n, n);
}

/*
ellipsoid:  (x/a)^2 + (y/b)^2 + (z/c)^2 = 1

algorithm: take a sphere point and stretch x by a, y by b, z by c.
*/
function make_ellipsoid(a = 1, b = .6, c = .4, n = 24) {
  return make_surface((u, v) => {
    let theta = 2 * Math.PI * u, phi = Math.PI * v - Math.PI / 2;
    return [a * Math.cos(theta) * Math.cos(phi), b * Math.sin(theta) * Math.cos(phi), c * Math.sin(phi)];
  }, n, n);
}

/*
hemisphere:  x^2 + y^2 + z^2 = 1,  z >= 0

algorithm: same as the sphere, but phi only goes from 0 (equator) to pi/2 (top).
then close the open bottom with a disk facing down.
*/
function make_hemisphere(n = 20) {
  let dome = make_surface((u, v) => {
    let theta = 2 * Math.PI * u, phi = v * Math.PI / 2;
    return [Math.cos(theta) * Math.cos(phi), Math.sin(theta) * Math.cos(phi), Math.sin(phi)];
  }, n, n);
  return dome.concat(make_disk(n, 0, -1));
}

/*
superellipsoid:  ( |x|^(2/e2) + |y|^(2/e2) )^(e2/e1) + |z|^(2/e1) = 1
  x = c(phi)^e1 c(theta)^e2,  y = c(phi)^e1 s(theta)^e2,  z = s(phi)^e1
  (c = cos, s = sin, powers keep the sign)

algorithm: like the sphere, but every cos/sin is raised to a power first.
e = 1 is a sphere, e near 0 squares it off toward a cube, e > 1 pinches it into a star.
*/
function make_superellipsoid(e1 = .4, e2 = .4, n = 32) {
  return make_surface((u, v) => {
    let theta = 2 * Math.PI * u, phi = Math.PI * v - Math.PI / 2;
    let cp = _spow(Math.cos(phi), e1);
    return [cp * _spow(Math.cos(theta), e2), cp * _spow(Math.sin(theta), e2), _spow(Math.sin(phi), e1)];
  }, n, n);
}

/*
cylinder:  x^2 + y^2 = 1,  -1 <= z <= 1
  x = cos(theta), y = sin(theta), z = 2v - 1

algorithm: walk around a circle (u) and slide up the height (v). add a disk on
top and one on the bottom.
*/
function make_cylinder(n = 32) {
  let side = make_surface((u, v) => {
    let theta = 2 * Math.PI * u;
    return [Math.cos(theta), Math.sin(theta), 2 * v - 1];
  }, n, 1);
  return side.concat(make_disk(n, 1, 1), make_disk(n, -1, -1));
}

/*
cone:  x^2 + y^2 = ((1 - z) / 2)^2,  apex at z = 1, base (radius 1) at z = -1
  x = (1 - v) cos(theta), y = (1 - v) sin(theta), z = 2v - 1

algorithm: same as the cylinder, but the circle shrinks linearly from radius 1 at
the bottom to 0 at the tip. add a disk under the base.
*/
function make_cone(n = 32) {
  let side = make_surface((u, v) => {
    let theta = 2 * Math.PI * u;
    return [(1 - v) * Math.cos(theta), (1 - v) * Math.sin(theta), 2 * v - 1];
  }, n, 1);
  return side.concat(make_disk(n, -1, -1));
}

/*
frustum (cone with the tip cut off):  r(z) = r0 + (r1 - r0) v,  z = 2v - 1
  x = r cos(theta), y = r sin(theta)

algorithm: a cylinder whose circle grows or shrinks linearly from r0 (bottom) to
r1 (top). caps use each end's own radius.
*/
function make_frustum(r0 = 1, r1 = .5, n = 32) {
  let side = make_surface((u, v) => {
    let theta = 2 * Math.PI * u, r = r0 + (r1 - r0) * v;
    return [r * Math.cos(theta), r * Math.sin(theta), 2 * v - 1];
  }, n, 1);
  return side.concat(make_disk(n, 1, 1, r1), make_disk(n, -1, -1, r0));
}

/*
capsule (pill):  distance from the segment (0,0,-h)-(0,0,h) equals r
  top cap:    z = h + r sin(phi),  phi in [0, pi/2]
  middle:     x^2 + y^2 = r^2,     z in [-h, h]
  bottom cap: z = -h + r sin(phi), phi in [-pi/2, 0]

algorithm: glue a half-sphere onto each end of a cylinder.
*/
function make_capsule(n = 24, h = .5, r = .5) {
  let cap = (z0, p0, p1) => make_surface((u, v) => {
    let theta = 2 * Math.PI * u, phi = p0 + (p1 - p0) * v;
    return [r * Math.cos(theta) * Math.cos(phi), r * Math.sin(theta) * Math.cos(phi), z0 + r * Math.sin(phi)];
  }, n, n >> 1);
  let mid = make_surface((u, v) => {
    let theta = 2 * Math.PI * u;
    return [r * Math.cos(theta), r * Math.sin(theta), h * (2 * v - 1)];
  }, n, 1);
  return cap(h, 0, Math.PI / 2).concat(mid, cap(-h, -Math.PI / 2, 0));
}

/*
torus:  ( sqrt(x^2 + y^2) - R )^2 + z^2 = r^2
  x = (R + r cos(phi)) cos(theta), y = (R + r cos(phi)) sin(theta), z = r sin(phi)

algorithm: theta goes around the big ring (radius R), phi goes around the small
tube (radius r). each (u,v) picks a spot on the tube at a spot on the ring.
*/
function make_torus(R = .7, r = .3, m = 40, n = 20) {
  return make_surface((u, v) => {
    let theta = 2 * Math.PI * u, phi = 2 * Math.PI * v;
    let d = R + r * Math.cos(phi);
    return [d * Math.cos(theta), d * Math.sin(theta), r * Math.sin(phi)];
  }, m, n);
}

/*
paraboloid (bowl):  z = x^2 + y^2
  x = v cos(theta), y = v sin(theta), z = v^2

algorithm: a circle of radius v, lifted to height v squared. v from 0 (bottom of
the bowl) to 1 (rim).
*/
function make_paraboloid(n = 32) {
  return make_surface((u, v) => {
    let theta = 2 * Math.PI * u;
    return [v * Math.cos(theta), v * Math.sin(theta), v * v];
  }, n, n >> 1);
}

/*
hyperboloid of one sheet (cooling tower):  x^2 + y^2 - z^2 = 1
  x = sqrt(1 + z^2) cos(theta), y = sqrt(1 + z^2) sin(theta), z = 2v - 1

algorithm: at each height z, draw a circle of radius sqrt(1 + z^2). it is
narrowest (radius 1) at z = 0 and flares outward up and down.
*/
function make_hyperboloid(n = 32) {
  return make_surface((u, v) => {
    let theta = 2 * Math.PI * u, z = 2 * v - 1, r = Math.sqrt(1 + z * z);
    return [r * Math.cos(theta), r * Math.sin(theta), z];
  }, n, n >> 1);
}

/*
saddle (hyperbolic paraboloid):  z = x^2 - y^2
  x = 2u - 1, y = 2v - 1, z = x^2 - y^2

algorithm: lay a flat grid over x and y, then set each height from the formula.
it curves up along x and down along y.
*/
function make_saddle(n = 24) {
  return make_surface((u, v) => {
    let x = 2 * u - 1, y = 2 * v - 1;
    return [x, y, x * x - y * y];
  }, n, n);
}

/*
catenoid (soap film between two rings):  x^2 + y^2 = cosh(z)^2
  x = cosh(z) cos(theta), y = cosh(z) sin(theta), z = 2v - 1

algorithm: at each height z, draw a circle of radius cosh(z). cosh is smallest
(1) at z = 0, so it pinches in the middle like a soap film.
*/
function make_catenoid(n = 32) {
  return make_surface((u, v) => {
    let theta = 2 * Math.PI * u, z = 2 * v - 1;
    return [Math.cosh(z) * Math.cos(theta), Math.cosh(z) * Math.sin(theta), z];
  }, n, n >> 1);
}

/*
helicoid (spiral ramp):  y cos(t) = x sin(t) with z = t / (2 pi)
  x = rho cos(t), y = rho sin(t), z = t / (2 pi),  rho in [-1,1], t in [-2 pi, 2 pi]

algorithm: take a straight line (rho) through the z axis, spin it as t goes up,
and raise it at a steady speed. the line sweeps out a screw-shaped ramp.
*/
function make_helicoid(n = 48) {
  return make_surface((u, v) => {
    let t = 4 * Math.PI * u - 2 * Math.PI, rho = 2 * v - 1;
    return [rho * Math.cos(t), rho * Math.sin(t), t / (2 * Math.PI)];
  }, n, 4);
}


/* ---------------------------------------------------------------------------
   flat shapes
--------------------------------------------------------------------------- */

/*
plane:  z = 0,  -1 <= x <= 1, -1 <= y <= 1
  x = 2u - 1, y = 2v - 1

algorithm: an m-by-n grid of little squares. the uv square covers the whole plane
once.
*/
function make_plane(m = 1, n = 1) {
  return make_surface((u, v) => [2 * u - 1, 2 * v - 1, 0], m, n);
}

/*
ring (annulus, a disk with a hole):  r0^2 <= x^2 + y^2 <= 1
  x = r cos(theta), y = -r sin(theta), r = r0 + (1 - r0) v

algorithm: walk around a circle (u) while the radius slides from the inner radius
to the outer radius (v). (the minus on y just makes it face +z.)
*/
function make_ring(r0 = .5, n = 32) {
  return make_surface((u, v) => {
    let theta = 2 * Math.PI * u, r = r0 + (1 - r0) * v;
    return [r * Math.cos(theta), -r * Math.sin(theta), 0];
  }, n, 1);
}

/*
wave (egg-crate heightfield):  z = A sin(k pi x) sin(k pi y)
  x = 2u - 1, y = 2v - 1

algorithm: a flat grid, with each height set by multiplying a sine along x by a
sine along y. k is how many bumps fit across.
*/
function make_wave(k = 3, A = .25, n = 48) {
  return make_surface((u, v) => {
    let x = 2 * u - 1, y = 2 * v - 1;
    return [x, y, A * Math.sin(k * Math.PI * x) * Math.sin(k * Math.PI * y)];
  }, n, n);
}


/* ---------------------------------------------------------------------------
   polyhedra (flat faces)
--------------------------------------------------------------------------- */

/*
box:  |x| <= a, |y| <= b, |z| <= c      (make_cube is a box with a = b = c = 1)

algorithm: the 8 corners are every combination of (+-a, +-b, +-c). a corner's
index bits say its signs: bit0 -> x, bit1 -> y, bit2 -> z. each of the 6 faces
lists its 4 corners in order around the face. uv: each face gets the full 0..1
square.
*/
function make_box(a = 1, b = 1, c = 1) {
  let verts = [];
  for (let i = 0; i < 8; i++)
    verts.push([i & 1 ? a : -a, i & 2 ? b : -b, i & 4 ? c : -c]);
  return make_polyhedron(verts, [
    [1, 3, 7, 5], [0, 2, 6, 4],   // +x, -x
    [2, 3, 7, 6], [0, 1, 5, 4],   // +y, -y
    [4, 5, 7, 6], [0, 1, 3, 2],   // +z, -z
  ]);
}

//return a unit-length cube (side length 2, centered on the origin);
function make_cube() {
  return make_box(1, 1, 1);
}

/*
tetrahedron (4 triangles): corners at alternating corners of a cube:
  (1,1,1) (1,-1,-1) (-1,1,-1) (-1,-1,1)      every pair is the same distance apart

algorithm: 4 corners, and every choice of 3 corners is a face.
*/
function make_tetrahedron() {
  return make_polyhedron(
    [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
    [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]]);
}

/*
octahedron (8 triangles):  |x| + |y| + |z| = 1

algorithm: 6 corners at +-x, +-y, +-z. a face is one corner from each axis pair
(x or -x, y or -y, z or -z), giving 2*2*2 = 8 faces.
*/
function make_octahedron() {
  let faces = [];
  for (let a of [0, 1]) for (let b of [2, 3]) for (let c of [4, 5]) faces.push([a, b, c]);
  return make_polyhedron(
    [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], faces);
}

/*
icosahedron (20 triangles): corners are the cyclic permutations of (0, +-1, +-phi),
  phi = (1 + sqrt(5)) / 2     (the golden ratio, phi^2 = phi + 1)

algorithm: 12 corners from the formula, scaled onto the unit sphere. two corners
share an edge if they are the shortest distance apart (2 before scaling). any 3
corners that are all joined to each other are a face.
*/
function _icosahedron_verts() {
  let p = (1 + Math.sqrt(5)) / 2, vs = [];
  for (let s of [1, -1]) for (let t of [1, -1])
    vs.push([0, s, t * p], [s, t * p, 0], [t * p, 0, s]);
  return vs;
}
function _icosahedron_faces(vs) {
  let near = (i, j) => Math.abs(Math.hypot(...vs[i].map((x, k) => x - vs[j][k])) - 2) < 1e-6;
  let faces = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++)
    if (near(i, j) && near(j, k) && near(i, k)) faces.push([i, j, k]);
  return faces;
}
function make_icosahedron() {
  let vs = _icosahedron_verts(), faces = _icosahedron_faces(vs);
  return make_polyhedron(vs.map(_normalize), faces);
}

/*
dodecahedron (12 pentagons): the dual of the icosahedron.
  corners = the centers of the icosahedron's 20 faces, pushed onto the unit sphere

algorithm: 1. build the icosahedron. 2. each of its 20 face-centers becomes a
corner. 3. each of its 12 corners becomes a pentagon, made of the 5 face-centers
that touch it, sorted by angle around that corner so they go around in order.
*/
function make_dodecahedron() {
  let raw = _icosahedron_verts(), faces = _icosahedron_faces(raw), iv = raw.map(_normalize);
  let verts = faces.map(f => _normalize([0, 1, 2].map(k => (iv[f[0]][k] + iv[f[1]][k] + iv[f[2]][k]) / 3)));
  let pent = [];
  for (let i = 0; i < 12; i++) {
    let axis = iv[i];
    let ref = Math.abs(axis[2]) < .9 ? [0, 0, 1] : [1, 0, 0];
    let e1 = _normalize(_cross(axis, ref)), e2 = _cross(axis, e1);
    let around = [];
    faces.forEach((f, fi) => { if (f.includes(i)) around.push(fi); });
    around.sort((a, b) =>
      Math.atan2(_dot(verts[a], e2), _dot(verts[a], e1)) - Math.atan2(_dot(verts[b], e2), _dot(verts[b], e1)));
    pent.push(around);
  }
  return make_polyhedron(verts, pent);
}

/*
pyramid with an n-sided base:  base corners (cos(2 pi i / n), sin(2 pi i / n), -1), tip (0, 0, 1)

algorithm: put n corners on a circle at the bottom and one tip above the center.
each side is a triangle (tip, corner i, corner i+1), and the bottom is one n-gon.
n = 4 is the classic square pyramid, n = 3 a tetrahedron.
*/
function make_pyramid(n = 4) {
  let verts = [], faces = [], base = [];
  for (let i = 0; i < n; i++) {
    verts.push([Math.cos(2 * Math.PI * i / n), Math.sin(2 * Math.PI * i / n), -1]);
    base.push(i);
    faces.push([n, i, (i + 1) % n]);
  }
  verts.push([0, 0, 1]);
  faces.push(base);
  return make_polyhedron(verts, faces);
}

/*
prism with an n-sided base:  corners (cos(2 pi i / n), sin(2 pi i / n), +-1)

algorithm: put the same n-gon at z = -1 and z = 1. connect matching corners with
rectangles for the sides, and use the two n-gons as the lid and floor. n = 3
triangle prism, n = 6 hex prism.
*/
function make_prism(n = 6) {
  let verts = [], faces = [], bottom = [], top = [];
  for (let i = 0; i < n; i++) {
    let c = Math.cos(2 * Math.PI * i / n), s = Math.sin(2 * Math.PI * i / n);
    verts.push([c, s, -1], [c, s, 1]);
    bottom.push(2 * i);
    top.push(2 * i + 1);
    let j = (i + 1) % n;
    faces.push([2 * i, 2 * j, 2 * j + 1, 2 * i + 1]);
  }
  faces.push(bottom, top);
  return make_polyhedron(verts, faces);
}


/* ---------------------------------------------------------------------------
   tubes and knots (a circle swept along a curve)
--------------------------------------------------------------------------- */

/*
make_tube: sweep a small circle of radius r along a 3d curve C(t), t in [0,1].

  T = normalize( C'(t) )                  direction the curve is heading
  N = normalize( C''(t) )                 direction the curve is bending toward
  B = T x N                               sideways, perpendicular to both
  P(t,phi) = C(t) + r ( cos(phi) N - sin(phi) B )

algorithm: 1. at each t, estimate T and N by looking at C a tiny step before and
after (the difference gives the heading, the second difference gives the bend).
2. N and B span the flat plane that cuts across the curve. walk a circle in that
plane around the curve's center point. 3. u is along the curve, v around the tube.
*/
function make_tube(C, r = .12, m = 100, n = 12) {
  return make_surface((u, v) => {
    let e = 1e-3;
    let a = C(u - e), c = C(u), b = C(u + e);
    let T = _normalize(_sub(b, a));
    let N = _normalize([0, 1, 2].map(k => a[k] + b[k] - 2 * c[k]));
    let B = _normalize(_cross(T, N));
    let phi = 2 * Math.PI * v;
    return [0, 1, 2].map(k => c[k] + r * (Math.cos(phi) * N[k] - Math.sin(phi) * B[k]));
  }, m, n);
}

/*
helix (spring):  C(s) = ( R cos(s), R sin(s), pitch * s )

algorithm: go around a circle of radius R while rising at a steady speed. s runs
for `turns` full turns, and the tube is wrapped around that path.
*/
function make_helix(turns = 3, R = .6, r = .1) {
  let S = 2 * Math.PI * turns;
  return make_tube(t => [R * Math.cos(S * t), R * Math.sin(S * t), 2 * t - 1], r, 40 * turns, 12);
}

/*
torus knot (p,q):  C(s) = ( (2 + cos(q s)) cos(p s), (2 + cos(q s)) sin(p s), sin(q s) ) / 3,  s in [0, 2 pi]
  (p = 2, q = 3 is the trefoil knot)

algorithm: a point that circles the donut's big ring p times while also circling
the donut's small tube q times, then closes up. wrap a tube around that path.
*/
function make_torus_knot(p = 2, q = 3, r = .12) {
  return make_tube(t => {
    let s = 2 * Math.PI * t, d = 2 + Math.cos(q * s);
    return [d * Math.cos(p * s) / 3, d * Math.sin(p * s) / 3, Math.sin(q * s) / 3];
  }, r, 160, 12);
}


/* ---------------------------------------------------------------------------
   famous strange surfaces
--------------------------------------------------------------------------- */

/*
mobius strip:  x = (1 + w cos(t/2)) cos(t),  y = (1 + w cos(t/2)) sin(t),  z = w sin(t/2)
  t = 2 pi u,  w = 0.4 (2v - 1)

algorithm: take a flat strip (v = across, w) and bend it into a loop (t). while
going around once, the strip's cross-section turns half a turn (t/2), so the
ends join with a twist. the strip has only one side, so shading flips at the seam.
*/
function make_mobius(n = 80) {
  return make_surface((u, v) => {
    let t = 2 * Math.PI * u, w = .4 * (2 * v - 1);
    let d = 1 + w * Math.cos(t / 2);
    return [d * Math.cos(t), d * Math.sin(t), w * Math.sin(t / 2)];
  }, n, 6);
}

/*
klein bottle (figure-8 immersion):
  x = (R + cos(t/2) sin(s) - sin(t/2) sin(2s)) cos(t)
  y = (R + cos(t/2) sin(s) - sin(t/2) sin(2s)) sin(t)
  z =      sin(t/2) sin(s) + cos(t/2) sin(2s)            s, t in [0, 2 pi]

algorithm: sweep a figure-8 shaped cross-section (s) around a circle (t) while
twisting it half a turn along the way, like the mobius strip but with a closed
loop instead of a strip. it crosses itself in 3d, and has one side only.
(scaled by 0.4 to fit the unit box)
*/
function make_klein(n = 64) {
  let R = 2, k = .4;
  return make_surface((u, v) => {
    let t = 2 * Math.PI * u, s = 2 * Math.PI * v;
    let d = R + Math.cos(t / 2) * Math.sin(s) - Math.sin(t / 2) * Math.sin(2 * s);
    return [k * d * Math.cos(t), k * d * Math.sin(t),
            k * (Math.sin(t / 2) * Math.sin(s) + Math.cos(t / 2) * Math.sin(2 * s))];
  }, n, n);
}

/*
dini's surface (twisted pseudosphere):
  x = a cos(t) sin(s),  y = a sin(t) sin(s),  z = a ( cos(s) + ln tan(s/2) ) + b t

algorithm: start from a pseudosphere (a trumpet-like horn from the ln tan(s/2)
term) and, as you go around (t), also drift upward by b per radian. the horn
becomes a spiral. (scaled by 0.4 to fit the unit box)
*/
function make_dini(n = 64) {
  let a = 1, b = .2, k = .4;
  return make_surface((u, v) => {
    let t = 4 * Math.PI * u, s = .05 + 1.95 * v;
    return [k * a * Math.cos(t) * Math.sin(s), k * a * Math.sin(t) * Math.sin(s),
            k * (a * (Math.cos(s) + Math.log(Math.tan(s / 2))) + b * t)];
  }, n * 2, n);
}


/* ---------------------------------------------------------------------------
   text
--------------------------------------------------------------------------- */

/*
text: one flat quad per character, each showing its cell of a font image.

the font image is a grid of 12 columns x 8 rows holding ascii characters 32 (space)
and up, left-to-right, top-to-bottom:
  index = charCode - 32
  column = index mod 12,  row = floor(index / 12)
  u0 = column / 12 + .007,   u1 = u0 + (1/12) * .81      (a hair of padding so
                                                          neighbours don't bleed in)
  v0 = row / 8,              v1 = v0 + 1/8

algorithm: 1. for each character i, make a quad from x = i to x = i + 1, y from
-1 to 1 (so letters sit side by side, one unit apart). 2. look up that character's
cell in the font image from the formula above and use it as the uv rectangle.
3. the whole message is these quads joined together. draw it with the font image
as the texture (e.g. scale it down with the matrix to get a sensible size).
*/
function make_text(str) {
  let char = (c, i) => {
    let u0 = ((c - 32) % 12) / 12 + .007, u1 = u0 + 1 / 12 * .81;
    let v0 = ((c - 32) / 12 >> 0) / 8, v1 = v0 + 1 / 8;
    return [i, 1, 0, 0, 0, 1, u0, v0,   i + 1, -1, 0, 0, 0, 1, u1, v1,   i, -1, 0, 0, 0, 1, u0, v1,
            i, 1, 0, 0, 0, 1, u0, v0,   i + 1, -1, 0, 0, 0, 1, u1, v1,   i + 1, 1, 0, 0, 0, 1, u1, v0];
  };
  let mesh = [];
  for (let i = 0; i < str.length; i++)
    mesh.push(...char(str.charCodeAt(i), i));
  return mesh;
}
