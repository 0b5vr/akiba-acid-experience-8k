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

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

float map(vec3 p) {
  p.xy *= r2d(0.2 * p.z + 0.2 * t);
  p.z -= fract(2.0 * t);
  p = fract(p) - 0.5;
  p = abs(p);
  p.xy = p.x > p.y ? p.xy : p.yx;
  p.xz = p.x > p.z ? p.xz : p.zx;
  return sdbox(p, vec3(0.48, 0.02, 0.1));
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

  vec3 ro = vec3(0.0);
  vec3 rd = normalize(vec3(p, -2.0));
  float rl = 0.0;
  float dist;

  for (int i = 0; i < 100; i++) {
    dist = map(ro + rd * rl);
    rl += dist;
  }

  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (dist < 0.01) {
    vec3 i_n = nMap(ro + rd * rl);
    vec3 r = reflect(rd, i_n);
    r.yz *= r2d(t);
    float i_fog = exp(-0.4 * rl);

    float i_rawnoise = cyclic(4.0 * r, 0.5, 2.0).x;
    float i_noise = 4.0 * pow(0.5 + 0.5 * i_rawnoise, 4.0);
    outColor = vec4(vec3(i_fog * i_noise), 1.0);
  }
}
