#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

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

float sdTorus(vec3 p, vec2 t2) {
  vec2 q = vec2(length(p.xz) - t2.x, p.y);
  return length(q) - t2.y;
}

float map(vec3 p) {
  float chainWave = 0.4 * sin(p.z * 1.5 + t * 2.0);
  p.x -= chainWave;
  p.y += 0.3 * sin(p.z * 1.5 + t * 2.0 + 1.5);

  float zcell = floor(p.z * 2.0 + 0.5);
  float pz = p.z * 2.0 - zcell;
  vec3 pt = vec3(p.x, p.y, pz * 0.5);
  if (mod(zcell, 2.0) > 0.5) { pt.xy = pt.yx; } // リングを交互に90度回転

  return sdTorus(pt, vec2(0.35, 0.1));
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

  vec3 ro = vec3(0.0, 0.0, 3.0 * t);
  vec3 rd = normalize(vec3(p, -1.5));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 70; i++) {
    dist = map(ro + rd * rl);
    rl += 0.6 * dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 rp = ro + rd * rl;
    vec3 n = nMap(rp);
    vec3 r = reflect(rd, n);
    float noise = pow(0.5 + 0.5 * cyclic(4.0 * r, 0.5, 2.0).x, 3.0);
    col = vec3(noise) * exp(-0.03 * rl);
  }

  outColor = vec4(col, 1.0);
}
