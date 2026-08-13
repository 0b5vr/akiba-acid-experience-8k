#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D g;

in vec2 v;

out vec4 outColor;

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

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

float map(vec3 p) {
  p.xz *= r2d(t * 0.5);
  vec2 uv = p.xy * 0.5 + 0.5;
  float mask = texture(g, uv).x;
  float ext = mix(0.02, 0.12, mask);
  return sdbox(p, vec3(0.5, 0.5, ext));
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

  vec3 ro = vec3(0.0, 0.0, 2.2);
  vec3 rd = normalize(vec3(p, -1.6));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 60; i++) {
    dist = map(ro + rd * rl);
    rl += dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.005) {
    vec3 rp = ro + rd * rl;
    vec3 n = nMap(rp);
    vec3 r = reflect(rd, n);
    float noise = pow(0.5 + 0.5 * cyclic(4.0 * r, 0.5, 2.0).x, 3.0);
    col = vec3(noise);
  }

  outColor = vec4(col, 1.0);
}
