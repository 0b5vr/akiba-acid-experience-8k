#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;
const float PI = acos(-1.0);

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

float map(vec3 p) {
  float pulse = 0.08 * sin(t * BPS * PI);
  float wobble = 0.1 * cyclic(vec3(p.xy * 2.0, p.z * 0.3), 0.5, 2.0).x;
  float r = 1.0 + pulse + wobble;
  return r - length(p.xy);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0 * t);
  vec3 rd = normalize(vec3(p, -1.3));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 70; i++) {
    dist = map(ro + rd * rl);
    rl += 0.5 * dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 rp = ro + rd * rl;
    float glow = 0.5 + 0.5 * sin(rp.z * 5.0 + t * 6.0);
    col = mix(vec3(0.6, 0.05, 0.1), vec3(1.0, 0.3, 0.3), glow) * exp(-0.04 * rl);
  }

  outColor = vec4(col, 1.0);
}
