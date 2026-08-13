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

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 col = vec3(0.0);

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec3 pp = vec3(p * (1.5 + 0.5 * fi), t * 0.3 + fi * 5.0);
    float n = cyclic(pp, 0.5, 2.0).x;
    float layer = smoothstep(0.0, 0.6, n) * (1.0 / (fi + 1.0));
    col += layer * mix(vec3(0.8, 0.2, 1.0), vec3(0.2, 0.8, 1.0), fi / 2.0);
  }

  outColor = vec4(col, 1.0);
}
