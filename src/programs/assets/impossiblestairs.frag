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

float sdBox2D(vec2 p, vec2 s) {
  vec2 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(d.x, d.y));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;
  p *= r2d(t * 0.15);

  float d = 1e9;
  float shade = 0.0;

  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float a = fi / 12.0 * TAU;
    vec2 center = 0.55 * vec2(cos(a), sin(a));
    vec2 local = p - center;
    mat2 r = r2d(-a);
    vec2 lp = r * local;
    float bd = sdBox2D(lp, vec2(0.22, 0.08));
    if (bd < d) {
      d = bd;
      shade = fract(fi / 12.0 * 3.0);
    }
  }

  float line = smoothstep(0.02, 0.0, d);
  vec3 col = line * mix(vec3(0.3), vec3(1.0), shade);

  outColor = vec4(col, 1.0);
}
