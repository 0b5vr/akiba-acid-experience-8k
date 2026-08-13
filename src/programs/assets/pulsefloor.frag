#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 cell = floor(p * 6.0);
  float dist = length(cell);
  float wave = fract(t * BPS / 2.0 - dist * 0.15);
  float pulse = exp(-6.0 * wave);

  vec3 col = pulse * mix(vec3(0.1, 0.4, 1.0), vec3(1.0, 0.1, 0.6), hash(cell));

  outColor = vec4(col, 1.0);
}
