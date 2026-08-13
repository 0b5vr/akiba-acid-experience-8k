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

  vec2 warp = cyclic(vec3(p * 1.5, t * 0.2), 0.5, 2.0).xy * 0.3;
  vec2 pw = p + warp;

  vec3 n1 = cyclic(vec3(pw * 3.0, t * 0.3 + 5.0), 0.5, 2.0);
  float facet = smoothstep(-0.3, 0.7, n1.x);

  vec3 col = mix(vec3(0.1, 0.15, 0.3), vec3(0.6, 0.9, 1.0), facet);
  col += 0.2 * pow(facet, 4.0);

  outColor = vec4(col, 1.0);
}
