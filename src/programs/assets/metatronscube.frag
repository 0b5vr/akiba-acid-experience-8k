#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float TAU = acos(-1.0) * 2.0;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

vec2 nodePos(int i) {
  if (i == 0) { return vec2(0.0); }
  int ring = (i - 1) / 6;
  int idx = (i - 1) % 6;
  float r = float(ring + 1) * 0.28;
  float a = float(idx) / 6.0 * TAU;
  return r * vec2(cos(a), sin(a));
}

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;
  p *= r2d(t * 0.2);

  float d = 1e9;

  for (int i = 0; i < 13; i++) {
    vec2 a = nodePos(i);
    for (int j = i + 1; j < 13; j++) {
      vec2 b = nodePos(j);
      if (length(a - b) < 0.6) {
        d = min(d, sdSeg(p, a, b));
      }
    }
  }

  float line = smoothstep(0.008, 0.0, d);
  vec3 col = line * vec3(0.9, 0.7, 1.0);

  outColor = vec4(col, 1.0);
}
