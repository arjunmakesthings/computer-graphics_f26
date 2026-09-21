//define variable: 
let start_time = Date.now() / 1000;

//update function; called from webgl.js. 
this.update = () => {
  let t = Date.now() / 1000 - start_time;
  //   console.log(t % 1);
  set_uniform("1f", "u_time", t);
};
