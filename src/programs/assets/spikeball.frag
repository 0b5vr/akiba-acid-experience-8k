#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);
const float foldcos = cos(PI / 5.0);
const float foldrem = sqrt(0.75 -foldcos * foldcos);
const vec3 foldvec = vec3(-0.5, -foldcos, foldrem);
const vec3 foldsurf = normalize(vec3(0.0, foldrem, foldcos));

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

float map(vec3 p) {
  p.yz *= r2d(sin(1.0 * t));
  p.zx *= r2d(5.0 * t);

  for (int i = 0; i < 5; i++) {
    p.xy = sqrt(p.xy * p.xy + 0.0002);
    p -= 2.0 * min(0.0, dot(p, foldvec)) * foldvec;
  }

  return length(foldsurf * dot(foldsurf, p) - p) - 0.18 + 0.3 * length(p);
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

  vec3 ro = vec3(0.0, 0.0, 1.5);
  vec3 rd = normalize(vec3(p, -2.0));
  float dist;

  for (int i = 0; i < 100; i++) {
    dist = map(ro);
    ro += rd * dist;
  }

  outColor = vec4(0);
  if (abs(dist) < 0.01) {
    vec3 i_n = nMap(ro);
    vec3 r = reflect(rd, i_n);
    r.yz *= r2d(t);

    float i_rawnoise = cyclic(r, 0.5, 2.0).x;
    float noise = 4.0 * pow(0.5 + 0.5 * i_rawnoise, 2.0);
    outColor = vec4(noise * (0.5 + 0.5 * cos(noise + vec3(0, 2, 4) + 3.0)), 1.0);
  }
}
