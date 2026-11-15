//boilerplate v4; from ken; modified by me; helped by claude.
//same as v3.1, plus textures (from class-10's webgl4.js):
//  load_texture(index, file_name)           load an image into texture slot 0-15
//  draw(mesh, material, matrix, texture, sheer)
//                                           texture = slot number, or -1 for none
//                                           sheer = 0 opaque .. 1 see-through
//  scene.init()                             called once, after gl is ready
//
//in the fragment shader, declare:
//  uniform sampler2D u_sampler[16];  uniform int u_texture;
//and sample with: texture(u_sampler[0], v_uv)   (webgl2 wants a constant index,
//so write one if-line per slot you use, like class-10 does.)

function gl_start(canvas, scene) {
  //define noise; like ken; in js:
  let def_noise = (fs) => {
    let i = fs.indexOf(";") + 1;
    return (
      fs.substring(0, i) +
      "vec3 _s(vec3 i){return cos(5.*(i+5.*cos(5.*(i.yzx+5.*cos(5.*(i.zxy+5.*cos(5.*i)))))));}float _t(vec3 i,vec3 u,vec3 a){return dot(normalize(_s(i+a)),u-a);}float noise(vec3 p){vec3 i=floor(p),u=p-i,v=2.*mix(u*u,u*(2.-u)-.5,step(.5,u));return mix(mix(mix(_t(i,u,vec3(0)),_t(i,u,vec3(1,0,0)),v.x),mix(_t(i,u,vec3(0,1,0)),_t(i,u,vec3(1,1,0)),v.x),v.y),mix(mix(_t(i,u,vec3(0,0,1)),_t(i,u,vec3(1,0,1)),v.x),mix(_t(i,u,vec3(0,1,1)),_t(i,u,vec3(1)),v.x),v.y),v.z);}" +
      fs.substring(i)
    );
  };

  setTimeout(function () {
    window.gl = canvas.getContext("webgl2");
    gl.program = gl.createProgram();
    let addshader = (type, src) => {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.log("cannot compile shader:", gl.getShaderInfoLog(shader));
      gl.attachShader(gl.program, shader);
    };
    addshader(gl.VERTEX_SHADER, scene.vertex_shader);
    addshader(gl.FRAGMENT_SHADER, def_noise(scene.fragment_shader));
    gl.linkProgram(gl.program);
    if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS))
      console.log("could not link the shader program!");
    gl.useProgram(gl.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL);

    let bpe = Float32Array.BYTES_PER_ELEMENT;

    let set_vertex_attribute = (name, size, position) => {
      let location = gl.getAttribLocation(gl.program, name);
      if (location < 0) return; //skip attributes the shader doesn't use.
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(
        location,
        size,
        gl.FLOAT,
        false,
        scene.vertex_size * bpe,
        position * bpe,
      );
    };

    gl.vertex_size = scene.vertex_size;

    for (let name in scene.vertex_attributes) {
      let attribute = scene.vertex_attributes[name];
      set_vertex_attribute(name, attribute.size, attribute.position);
    }

    //texture slots 0..15 -> the sampler array. (ignored if the shader has none.)
    set_uniform("1iv", "u_sampler", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    set_uniform("1i", "u_texture", -1);

    let shapes = scene.shapes ?? [];
    for (let n = 0; n < shapes.length; n++) {
      shapes[n].mesh = new Float32Array(shapes[n].vertices);

      //give every shape a matrix, so the draw loop can't crash.
      if (!shapes[n].matrix) {
        shapes[n].matrix = new Matrix();
        shapes[n].matrix.identity();
      }
    }

    if (scene.init) scene.init();

    setInterval(function () {
      if (scene.update) scene.update();

      //any stored shapes are drawn after update, same as before.
      //a stored shape can carry a `texture` slot number too.
      for (let n = 0; n < shapes.length; n++)
        draw(shapes[n].mesh, shapes[n].material, shapes[n].matrix, shapes[n].texture, shapes[n].sheer);
    }, 30);
  }, 100);
}

//load an image into texture slot `index` (0-15).
//until the image arrives the slot holds one white pixel, so shapes show plain
//lighting instead of going black. safe to call before gl exists.
let load_texture = (index, file_name) => {
  if (!window.gl) return void setTimeout(() => load_texture(index, file_name), 50);

  let upload = (source, ...size) => {
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ...size, gl.RGBA, gl.UNSIGNED_BYTE, source);
  };

  let texture = gl.createTexture();
  upload(new Uint8Array([255, 255, 255, 255]), 1, 1, 0); //placeholder
  //(no mipmaps yet, so the default min filter would make it incomplete and black.)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  let image = new Image();
  image.onload = function () {
    try {
      upload(image);
      //(magnification can't use mipmaps, only minification can.)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    } catch (e) {
      console.log(e);
    }
  };
  image.onerror = () => console.log("cannot load texture:", file_name);
  image.src = file_name;
};

//default material for any draw() that doesn't pass its own.
let default_material = {
  amb: [0.1, 0.1, 0.1],
  diff: [0.5, 0.5, 0.5],
  spec: [0, 0, 0, 1],
};

let mesh_cache = new WeakMap();
let as_mesh = (v) => {
  if (v instanceof Float32Array) return v;
  let mesh = mesh_cache.get(v);
  if (!mesh) mesh_cache.set(v, (mesh = new Float32Array(v)));
  return mesh;
};

//texture_index: which slot to sample (see load_texture); -1 (or undefined) = no texture.
//sheer: 0 = opaque, 1 = bright texels of the texture turn fully transparent
//  (for text: hides the font image's background). needs u_sheer in the shader:
//  frag_col = vec4(tex.rgb * sqrt(light), 1. - tex.r * u_sheer);
let draw = (mesh, material, matrix, texture_index = -1, sheer = 0) => {
  mesh = as_mesh(mesh);

  set_uniform("Matrix4fv", "u_mf", false, matrix.get());
  if (matrix.push) {
    matrix.push();
    matrix.inverse();
    set_uniform("Matrix4fv", "u_mi", false, matrix.get());
    matrix.pop();
  } else {
    matrix.inverse(); //fallback: invert twice.
    set_uniform("Matrix4fv", "u_mi", false, matrix.get());
    matrix.inverse();
  }

  //this draws material (or the default).
  let mat = material ?? default_material;
  set_uniform("3fv", "u_amb", mat.amb);
  set_uniform("3fv", "u_diff", mat.diff);
  set_uniform("4fv", "u_spec", mat.spec);

  set_uniform("1i", "u_texture", texture_index);
  set_uniform("1f", "u_sheer", sheer);

  gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.length / gl.vertex_size);
};

let set_uniform = (type, name, a, b, c) =>
  gl["uniform" + type](gl.getUniformLocation(gl.program, name), a, b, c);
