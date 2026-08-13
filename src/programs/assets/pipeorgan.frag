#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float map(vec3 p) {
  p.z -= 3.0 * t;
  vec2 cell = floor(p.xy * 1.5);
  vec2 pt = fract(p.xy * 1.5) - 0.5;
  float radius = 0.15 + 0.25 * hash(cell);
  return (length(pt) - radius) / 1.5;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0);
  vec3 rd = normalize(vec3(p, -1.3));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 60; i++) {
    dist = map(ro + rd * rl);
    rl += 0.7 * dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.005) {
    vec3 rp = ro + rd * rl;
    vec2 cell = floor(rp.xy * 1.5);
    col = mix(vec3(0.9, 0.7, 0.1), vec3(0.9, 0.9, 0.95), hash(cell)) * exp(-0.15 * rl);
  }

  outColor = vec4(col, 1.0);
}
