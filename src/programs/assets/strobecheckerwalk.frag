#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float stepIdx = floor(t * BPS);
  vec2 cell = floor(p * 6.0 + vec2(stepIdx, 0.0));
  float checker = mod(cell.x + cell.y, 2.0);
  float flash = step(0.9, fract(t * BPS));

  vec3 col = vec3(checker) * mix(vec3(1.0), vec3(1.0, 0.2, 0.2), flash);

  outColor = vec4(col, 1.0);
}
