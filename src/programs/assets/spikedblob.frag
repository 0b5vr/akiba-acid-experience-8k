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
  p.xy *= r2d(t * 0.3);
  float base = length(p) - 1.0;
  float spikeAmp = 0.35 * (0.5 + 0.5 * sin(t * BPS * PI));
  float spikes = spikeAmp * cyclic(normalize(p) * 4.0, 0.5, 2.0).x;
  return base - max(spikes, 0.0);
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.002);
  return normalize(vec3(
    map(p + d.yxx) - map(p - d.yxx),
    map(p + d.xyx) - map(p - d.xyx),
    map(p + d.xxy) - map(p - d.xxy)
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.6));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 70; i++) {
    dist = map(ro + rd * rl);
    rl += 0.7 * dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.015) {
    vec3 rp = ro + rd * rl;
    vec3 n = nMap(rp);
    const vec3 L = normalize(vec3(0.5, 1.0, 0.4));
    float diff = max(dot(n, L), 0.0);
    col = vec3(0.1) + diff * vec3(0.8, 0.2, 0.9);
  }

  outColor = vec4(col, 1.0);
}
