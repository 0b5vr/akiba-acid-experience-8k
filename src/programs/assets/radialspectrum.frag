#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = PI * 2.0;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float r = length(p);
  float a = atan(p.y, p.x);
  float bars = 32.0;
  float barIdx = floor((a + PI) / TAU * bars);
  float barPhase = hash(barIdx) * 6.28;
  float barLen = 0.3 + 0.5 * abs(sin(t * 3.0 + barPhase));

  float inBar = step(0.15, r) * step(r, 0.15 + barLen);
  vec3 col = inBar * mix(vec3(0.1, 1.0, 0.4), vec3(1.0, 0.1, 0.3), r / 0.65);

  outColor = vec4(col, 1.0);
}
