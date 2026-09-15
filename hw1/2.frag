#version 300 es
precision highp float;
in vec3 v_pos;
out vec4 rag_col;

uniform float u_time;
void main() {
    //reassign ins to mutate: 
    vec3 pos = v_pos; 

    // loat t = 0.;
    float t = u_time * 0.5;

    float d = sqrt(1. - dot(v_pos, v_pos));

    //lissajous curves; when cos & sin are incremented dierently.

    vec3 ld1_pos = vec3(cos(t - 1.), sin(t + 1.), 1.);
    vec3 ld2_pos = vec3(cos(t + 1.), sin(t - 1.), 0.);
    vec3 ld3_pos = vec3(cos(t + 0.), sin(t - 1.), 0.);

    float r = 0.5;

    if(d > r) {
        //cosine similarity; same vectors will be 1 or dot (pos, light position). 
        //how much the light covers is the irst variable. 
        // loat r = sin(t) * 0.05 + dot(pos * 0.02, ld1_pos);
        float r = .3 + dot(pos * 0.04, ld1_pos);
        float g = .1 + sin(t * 0.002) * dot(pos / 0.04, ld2_pos);
        float b = dot(pos * 0.04, ld3_pos);

        rag_col = vec4(0.0, g, 0., 1.0);
    } else {
        //deault / outside:
        float r = .3 + dot(pos * 0.04, ld1_pos);
        float g = .1 + sin(t * 0.002) * dot(pos / 0.04, ld2_pos);
        float b = dot(pos * 0.04, ld3_pos);

        rag_col = vec4(0.0, g, 0., 1.0);
        rag_col = vec4(r, 0.0, 0.0, 0.1);
    }

}