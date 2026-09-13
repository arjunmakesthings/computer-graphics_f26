//boilerplate from ken:
function gl_start(canvas, scene) {
  setTimeout(function () {
    window.gl = canvas.getContext("webgl2");
    gl.program = gl.createProgram();
    let add_shader = (type, src) => {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.log("can't compile shader.", gl.getShaderInfoLog(shader));
      gl.attachShader(gl.program, shader);
    };
    add_shader(gl.VERTEX_SHADER, scene.vertex_shader);
    add_shader(gl.FRAGMENT_SHADER, scene.fragment_shader);
    gl.linkProgram(gl.program);
    if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS))
      console.log("could not link to the shader files.");
    gl.useProgram(gl.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0, -1, -1, 0, 1, 1, 0,
      ]),
      gl.STATIC_DRAW,
    );
    let a_pos = gl.getAttribLocation(gl.program, "a_pos");
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 3, gl.FLOAT, false, 0, 0);
    setInterval(function () {
      if (scene.update) scene.update();
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }, 30);
  }, 100);
}
let set_uniform = (type, name, a, b, c) =>
  gl["uniform" + type](gl.getUniformLocation(gl.program, name), a, b, c);
