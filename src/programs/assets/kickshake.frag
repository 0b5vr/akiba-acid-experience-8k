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
  float beat = t * BPS;
  float kickPhase = fract(beat);
  float shakeAmt = exp(-15.0 * kickPhase);
  vec2 shakeOffset = shakeAmt * 0.05 * vec2(sin(t * 90.0), cos(t * 77.0));
  float zoomPunch = 1.0 - 0.1 * shakeAmt;

  vec2 p = (v + shakeOffset) * zoomPunch;
  p.x *= 16.0 / 9.0;

  vec2 cell = floor(p * 5.0);
  float pattern = step(0.5, hash(cell));

  vec3 col = vec3(pattern) * vec3(1.0, 0.9, 0.8);

  outColor = vec4(col, 1.0);
}
