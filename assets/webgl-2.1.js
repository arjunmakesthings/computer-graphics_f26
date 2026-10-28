//boilerplate v2; from ken; modified by me.

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

  //new (1): used by any shape that doesn't have its own material.
  let default_material = {
    amb: [0.1, 0.1, 0.1],
    diff: [0.5, 0.5, 0.5],
    spec: [0, 0, 0, 1],
  };

  setTimeout(function () {
    window.gl = canvas.getContext("webgl2");
    gl.program = gl.createProgram();
    let addshader = (type, src) => {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.log("Cannot compile shader:", gl.getShaderInfoLog(shader));
      gl.attachShader(gl.program, shader);
    };
    addshader(gl.VERTEX_SHADER, scene.vertex_shader);
    addshader(gl.FRAGMENT_SHADER, def_noise(scene.fragment_shader));
    gl.linkProgram(gl.program);
    if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS))
      console.log("Could not link the shader program!");
    gl.useProgram(gl.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL);

    let bpe = Float32Array.BYTES_PER_ELEMENT;

    let set_vertex_attribute = (name, size, position) => {
      let location = gl.getAttribLocation(gl.program, name);
      if (location < 0) return; //new (2): skip attributes the shader doesn't use.
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

    for (let name in scene.vertex_attributes) {
      let attribute = scene.vertex_attributes[name];
      set_vertex_attribute(name, attribute.size, attribute.position);
    }

    for (let n = 0; n < scene.shapes.length; n++) {
      scene.shapes[n].mesh = new Float32Array(scene.shapes[n].vertices);

      //new (3): give every shape a matrix, so the draw loop can't crash.
      if (!scene.shapes[n].matrix) {
        scene.shapes[n].matrix = new Matrix();
        scene.shapes[n].matrix.identity();
      }
    }

    setInterval(function () {
      if (scene.update) scene.update();
      for (let n = 0; n < scene.shapes.length; n++) {
        //new (4): this shape's matrix: forward, inverse, then restore forward.
        let m = scene.shapes[n].matrix;
        set_uniform("Matrix4fv", "u_mf", false, m.get());
        m.inverse();
        set_uniform("Matrix4fv", "u_mi", false, m.get());
        m.inverse();

        //new (5): this shape's material (or the default).
        let mat = scene.shapes[n].material ?? default_material;
        set_uniform("3fv", "u_amb", mat.amb);
        set_uniform("3fv", "u_diff", mat.diff);
        set_uniform("4fv", "u_spec", mat.spec);

        gl.bufferData(gl.ARRAY_BUFFER, scene.shapes[n].mesh, gl.STATIC_DRAW);
        gl.drawArrays(
          gl.TRIANGLES,
          0,
          scene.shapes[n].mesh.length / scene.vertex_size,
        );
      }
    }, 30);
  }, 100);
}

let set_uniform = (type, name, a, b, c) =>
  gl["uniform" + type](gl.getUniformLocation(gl.program, name), a, b, c);
