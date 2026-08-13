#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

float pattern(vec2 p) {
  float stripes = step(0.5, fract(p.x * 8.0 + 0.3 * sin(p.y * 3.0 + t)));
  float blockNoise = step(0.6, fract(sin(dot(floor(p * 6.0), vec2(12.9898, 78.233))) * 43758.5453));
  return max(stripes * 0.6, blockNoise);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float glitch = step(0.96, hash(floor(t * 12.0)));
  float offset = 0.02 + 0.06 * glitch;

  float r = pattern(p + vec2(offset, 0.0));
  float g = pattern(p);
  float b = pattern(p - vec2(offset, 0.0));

  outColor = vec4(r, g, b, 1.0);
}
