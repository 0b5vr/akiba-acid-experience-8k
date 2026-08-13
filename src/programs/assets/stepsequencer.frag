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

  vec2 grid = vec2(16.0, 4.0);
  vec2 cell = floor((p * 0.5 + 0.5) * grid);

  float stepIdx = mod(floor(t * BPS * 4.0), 16.0);
  float isCurrentStep = step(abs(cell.x - stepIdx), 0.5);

  float active = step(0.6, hash(cell));
  float lit = active * (0.3 + 0.7 * isCurrentStep);

  vec3 col = lit * mix(vec3(0.1, 0.5, 1.0), vec3(1.0, 0.8, 0.1), isCurrentStep);

  outColor = vec4(col, 1.0);
}
