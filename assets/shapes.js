//return a sphere with n-segments:
function make_sphere(n = 20) {
  let vs = [];

  let point = (u, v) => {
    let theta = 2 * Math.PI * u;
    let phi = Math.PI * v - Math.PI / 2;
    let x = Math.cos(theta) * Math.cos(phi);
    let y = Math.sin(theta) * Math.cos(phi);
    let z = Math.sin(phi);
    return [x, y, z, x, y, z]; //unit sphere: normal is the same as position.
  };

  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      let u0 = i / n,
        u1 = (i + 1) / n;
      let v0 = j / n,
        v1 = (j + 1) / n;
      vs.push(
        ...point(u0, v0),
        ...point(u1, v0),
        ...point(u1, v1),
        ...point(u0, v0),
        ...point(u1, v1),
        ...point(u0, v1),
      );
    }

  return vs;
}

//return a unit-length cube;
function make_cube() {
  return [
    //+x face:
     1, -1,  1,    1,  0,  0,
     1,  1, -1,    1,  0,  0,
     1, -1, -1,    1,  0,  0,
     1, -1,  1,    1,  0,  0,
     1,  1, -1,    1,  0,  0,
     1,  1,  1,    1,  0,  0,

    //-x face:
    -1, -1,  1,   -1,  0,  0,
    -1,  1, -1,   -1,  0,  0,
    -1, -1, -1,   -1,  0,  0,
    -1, -1,  1,   -1,  0,  0,
    -1,  1, -1,   -1,  0,  0,
    -1,  1,  1,   -1,  0,  0,

    //+y face:
    -1,  1,  1,    0,  1,  0,
     1,  1, -1,    0,  1,  0,
    -1,  1, -1,    0,  1,  0,
    -1,  1,  1,    0,  1,  0,
     1,  1, -1,    0,  1,  0,
     1,  1,  1,    0,  1,  0,

    //-y face:
    -1, -1,  1,    0, -1,  0,
     1, -1, -1,    0, -1,  0,
    -1, -1, -1,    0, -1,  0,
    -1, -1,  1,    0, -1,  0,
     1, -1, -1,    0, -1,  0,
     1, -1,  1,    0, -1,  0,

    //+z face:
    -1,  1,  1,    0,  0,  1,
     1, -1,  1,    0,  0,  1,
    -1, -1,  1,    0,  0,  1,
    -1,  1,  1,    0,  0,  1,
     1, -1,  1,    0,  0,  1,
     1,  1,  1,    0,  0,  1,

    //-z face:
    -1,  1, -1,    0,  0, -1,
     1, -1, -1,    0,  0, -1,
    -1, -1, -1,    0,  0, -1,
    -1,  1, -1,    0,  0, -1,
     1, -1, -1,    0,  0, -1,
     1,  1, -1,    0,  0, -1,
  ];
}

