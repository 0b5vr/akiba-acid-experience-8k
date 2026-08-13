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

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float map(vec3 p) {
  vec2 cell = floor(p.xz);
  vec3 pt = p;
  pt.xz = fract(p.xz) - 0.5;
  float h = 0.3 + 0.7 * hash(cell);
  pt.y -= h - 1.0;
  return sdbox(pt, vec3(0.35, h, 0.35));
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

  // 真上からの疑似正射影カメラ
  vec3 ro = vec3(3.0 * p.x, 4.0, 3.0 * p.y + 1.0);
  vec3 rd = normalize(vec3(0.0, -1.0, 0.35));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 50; i++) {
    dist = map(ro + rd * rl);
    rl += 0.7 * dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.02) {
    vec3 rp = ro + rd * rl;
    vec3 n = nMap(rp);
    vec3 r = reflect(rd, n);
    float noise = pow(0.5 + 0.5 * cyclic(4.0 * r, 0.5, 2.0).x, 3.0);
    col = vec3(noise);
  }

  outColor = vec4(col, 1.0);
}
