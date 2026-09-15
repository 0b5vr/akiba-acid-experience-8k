#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);
const float BPS = 140.0 / 60.0;
const float A = 5.0;
const float T = 0.07;

vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

mat3 orthbas(vec3 z) {
  z = normalize(z);
  vec3 up = abs(z.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  vec3 x = normalize(cross(up, z));
  return mat3(x, cross(z, x), z);
}

vec3 cyclic(vec3 p, float pers, float lacu) {
  vec4 sum = vec4(0);
  mat3 rot = orthbas(vec3(2, -3, 1));

  for (int i = 0; i < 5; i++) {
    p *= rot;
    p += sin(p.zxy);
    sum += vec4(cross(cos(p), sin(p.yzx)), 1);
    sum /= pers;
    p *= lacu;
  }

  return sum.xyz / sum.w;
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float slope(float r) {
  return A / (r * r) + T;
}

float map(vec3 p) {
  float r = max(length(p.xz), 0.1);
  return (p.y + A / r - T * r) / (1.0 + slope(r));
}

void main() {
  float b = t * BPS;

  vec3 ro = vec3(0.0, 1.8, 3.6) + vec3(1.6, 0.2, 1.2) * cyclic(vec3(0.1 * b), 0.5, 1.0);
  vec3 m = cyclic(vec3(0.125 * b), 0.5, 1.0);
  vec3 rd = normalize(vec3(v.x * 16.0 / 9.0, v.y, -1.5));
  rd.xy *= r2d(0.82 * m.x);
  rd.yz *= r2d(0.81 + 0.18 * m.y);
  rd.xz *= r2d(0.15 * m.z);

  float rl = 0.0;
  float dist;

  for(int i = 0; i < 150; i++) {
    dist = map(ro);
    ro += rd * dist;
    rl += dist;
  }

  float col = 0.0;

  if(dist < 0.001) {
    ro.zx *= r2d(t);

    vec2 g = vec2(4.0 * ro.y - 1.2 * b, 12.0 * atan(ro.z, ro.x) / PI);
    vec2 w = min(fwidth(g), 0.1);
    float px = max(6.0 / rl, 1.0);
    vec2 lines = smoothstep((px + 0.5) * w, (px - 0.5) * w, 0.5 - abs(fract(g) - 0.5));

    float i_cell = step(hash3f(vec3(floor(g), floor(4.0 * b))).x, 0.06);

    col = max(max(lines.x, lines.y), i_cell) * smoothstep(12.0, 6.0, rl) * smoothstep(12.0, 6.0, rl);
  }

  outColor = vec4(vec3(col), 1.0);
}
