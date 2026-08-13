#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float triGrid(vec2 p) {
  const vec2 s = vec2(1.0, 1.7320508);
  vec2 a = mod(p, s) - s * 0.5;
  vec2 b = mod(p - s * 0.5, s) - s * 0.5;
  vec2 q = dot(a, a) < dot(b, b) ? a : b;
  return length(q);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 p1 = p * r2d(0.2 * t) * 12.0;
  vec2 p2 = p * r2d(-0.15 * t + 0.5) * 12.0;

  float g1 = step(triGrid(p1), 0.15);
  float g2 = step(triGrid(p2), 0.15);

  float moirePattern = g1 * g2 + (1.0 - g1) * (1.0 - g2) * 0.3;

  outColor = vec4(vec3(moirePattern), 1.0);
}
