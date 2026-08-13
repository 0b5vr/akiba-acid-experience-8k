#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;
const float PI = acos(-1.0);

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float bars = 24.0;
  float x = (p.x + 1.4) / 2.8 * bars;
  float barIdx = floor(x);
  float barPhase = hash(barIdx) * 6.28;
  float height = 0.3 + 0.6 * abs(sin(t * BPS * PI + barPhase));

  float inBar = step(abs(fract(x) - 0.5), 0.35);
  float yNorm = (p.y + 1.0) * 0.5;
  float lit = inBar * step(yNorm, height);

  vec3 col = lit * mix(vec3(0.1, 1.0, 0.6), vec3(1.0, 0.2, 0.6), height);

  outColor = vec4(col, 1.0);
}
