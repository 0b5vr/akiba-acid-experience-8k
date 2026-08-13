#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;
const float PI = acos(-1.0);

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

vec3 hash3(float n) {
  vec3 p = fract(vec3(n * 127.1, n * 311.7, n * 74.7) * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float assemble = 0.5 + 0.5 * sin(t * BPS * 0.5 * PI);

  float minDist = 1e9;
  const int N = 20;

  for (int i = 0; i < N; i++) {
    float fi = float(i);
    vec3 scattered = (hash3(fi) - 0.5) * 3.0;
    vec3 target = normalize(hash3(fi + 50.0) - 0.5) * 0.7;
    vec3 pos = mix(scattered, target, assemble);
    pos.xy *= r2d(t * 0.3);
    minDist = min(minDist, length(p - pos.xy) - 0.02);
  }

  float dotShape = smoothstep(0.0, -0.02, minDist);
  vec3 col = dotShape * vec3(0.9, 0.95, 1.0);

  outColor = vec4(col, 1.0);
}
