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

const float PI = acos(-1.0);
const float TAU = PI * 2.0;

vec3 torusKnot(float s, float p, float q, float R, float r) {
  float a = s * TAU;
  float qaP = q * a / p;
  float cr = R + r * cos(qaP);
  return vec3(cr * cos(a), cr * sin(a), r * sin(qaP));
}

vec2 project(vec3 p) {
  p.yz *= r2d(0.6);
  p.xz *= r2d(t * 0.4);
  return p.xy / (1.0 + p.z * 0.3);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float minDist = 1e9;
  const int N = 150;
  vec2 prev = project(torusKnot(0.0, 2.0, 3.0, 0.9, 0.3));

  for (int i = 1; i <= N; i++) {
    float s = float(i) / float(N);
    vec2 cur = project(torusKnot(s, 2.0, 3.0, 0.9, 0.3));
    vec2 pa = p - prev, ba = cur - prev;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    minDist = min(minDist, length(pa - ba * h));
    prev = cur;
  }

  float line = smoothstep(0.02, 0.0, minDist);
  vec3 col = line * vec3(1.0, 0.6, 0.1);

  outColor = vec4(col, 1.0);
}
