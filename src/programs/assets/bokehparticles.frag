#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

vec3 hash3(float n) {
  vec3 p = fract(vec3(n * 127.1, n * 311.7, n * 74.7) * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 col = vec3(0.0);
  const int N = 25;

  for (int i = 0; i < N; i++) {
    float fi = float(i);
    vec3 h = hash3(fi);
    vec2 pos = (h.xy - 0.5) * 2.2;
    pos.y += 0.3 * sin(t * 0.5 + fi);

    float depth = 0.3 + 0.7 * h.z;
    float r = 0.03 + 0.08 * depth;
    float d = length(p - pos);
    float bokeh = smoothstep(r, r * 0.7, d) - smoothstep(r * 0.7, r * 0.4, d) * 0.5;

    vec3 bokehCol = mix(vec3(1.0, 0.8, 0.5), vec3(0.5, 0.7, 1.0), h.z);
    col += bokeh * bokehCol * 0.5;
  }

  outColor = vec4(col, 1.0);
}
