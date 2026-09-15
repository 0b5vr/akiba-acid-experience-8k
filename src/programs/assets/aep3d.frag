#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
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

float sdcapsule(vec2 p, vec2 tail) {
  float t = clamp(dot(p, tail) / dot(tail, tail), 0.0, 1.0);
  return length(p - (tail * t));
}

float sdhalfarc(vec2 p, float r) {
  p.y = abs(p.y);
  return (p.x > 0.0)
    ? abs(length(p) - r)
    : length(p - vec2(0.0, r));
}

float sdAEP(vec2 p) {
  float d = 1e6;

  // A
  d = min(d, sdcapsule(p - vec2(-0.9, 0.4), vec2(0.0, -0.8)) - 0.3);
  d = min(d, sdcapsule(p - vec2(-0.9, 0.4), vec2(-0.8, -0.8)) - 0.3);
  d = max(d, -sdcapsule(p - vec2(-1.1, -0.252), vec2(-0.2, -0.2)) + 0.02);

  // E
  d = min(d, sdcapsule(p - vec2(-0.2, -0.4), vec2(0.5, 0.0)) - 0.3);
  d = max(d, -sdhalfarc(p - vec2(0.3, 0.0), 0.32) + 0.02);
  d = min(d, sdcapsule(p - vec2(-0.2, 0.0), vec2(0.5, 0.0)) - 0.3);
  d = max(d, -sdhalfarc(p - vec2(0.3, 0.4), 0.32) + 0.02);
  d = min(d, sdcapsule(p - vec2(-0.2, 0.4), vec2(0.5, 0.0)) - 0.3);
  d = min(d, sdcapsule(p - vec2(-0.2, 0.4), vec2(0.0, -0.8)) - 0.3);

  // P
  d = min(d, sdcapsule(p - vec2(1.0, 0.4), vec2(0.4, -0.0)) - 0.3);
  d = min(d, sdcapsule(p - vec2(1.0, -0.1), vec2(0.4, -0.0)) - 0.3);
  d = min(d, sdhalfarc(p - vec2(1.4, 0.15), 0.25) - 0.3);
  d = max(d, 0.04 - length(p - vec2(1.32, 0.15)));
  d = min(d, sdcapsule(p - vec2(1.0, 0.4), vec2(0.0, -0.8)) - 0.3);
  d = max(d, -sdcapsule(p - vec2(1.32, -0.25), vec2(0.0, -0.2)) + 0.02);

  return d;
}

float map(vec3 p) {
  p.zx *= r2d(4.0 * t);

  float d2d = sdAEP(p.xy);

  vec2 w = vec2(d2d, abs(p.z) - 0.2) + 0.04;
  float d = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.1;

  return d;
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx) - map(p - d.yxx),
    map(p + d.xyx) - map(p - d.xyx),
    map(p + d.xxy) - map(p - d.xxy)
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0);
  vec3 rd = normalize(vec3(p, -2.0));
  float dist;

  for (int i = 0; i < 100; i++) {
    dist = map(ro);
    ro += rd * dist;
  }

  outColor = vec4(0.0, 0.0, 0.0, 0.0);
  if (abs(dist) < 0.01) {
    vec3 i_n = nMap(ro);
    vec3 r = reflect(rd, i_n);

    float i_rawnoise = cyclic(3.0 * r, 0.5, 2.0).x;
    float i_noise = pow(0.5 + 0.5 * i_rawnoise, 2.0);
    outColor = vec4(vec3(i_noise), 1.0);
  }
}
