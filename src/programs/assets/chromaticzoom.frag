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

float pattern(vec2 p) {
  vec2 cell = floor(p * 6.0);
  return step(0.5, hash(cell));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float beat = fract(t * BPS / 2.0);
  float punch = exp(-8.0 * beat) * 0.15;

  float r = pattern(p * (1.0 - punch * 1.0));
  float g = pattern(p * (1.0 - punch * 0.6));
  float b = pattern(p * (1.0 - punch * 0.2));

  outColor = vec4(r, g, b, 1.0);
}
