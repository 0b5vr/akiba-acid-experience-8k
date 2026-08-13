#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = PI * 2.0;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float circleLine(vec2 p, vec2 c, float r) {
  return abs(length(p - c) - r) - 0.006;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;
  p *= r2d(0.15 * t);

  float radius = 0.18;
  float d = 1e9;

  // 中心の円
  d = min(d, circleLine(p, vec2(0.0), radius));

  // 第1リング(6個)
  for (int i = 0; i < 6; i++) {
    float a = TAU * float(i) / 6.0;
    vec2 c = radius * vec2(cos(a), sin(a));
    d = min(d, circleLine(p, c, radius));
  }

  // 第2リング(6個)
  for (int i = 0; i < 6; i++) {
    float a = TAU * float(i) / 6.0 + TAU / 12.0;
    vec2 c = radius * sqrt(3.0) * vec2(cos(a), sin(a));
    d = min(d, circleLine(p, c, radius));
  }

  float line = smoothstep(0.008, 0.0, d);
  float pulse = 0.6 + 0.4 * sin(4.0 * t);

  vec3 col = line * pulse * vec3(1.0, 0.85, 1.0);

  outColor = vec4(col, 1.0);
}
