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

float ridged(vec2 p) {
  float n = cyclic(vec3(p, t * 0.2), 0.5, 2.0).x;
  return 1.0 - abs(n);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float h = 0.0;
  float amp = 0.5;
  vec2 pp = p * 2.0;

  for (int i = 0; i < 4; i++) {
    h += amp * ridged(pp);
    amp *= 0.5;
    pp *= 2.1;
  }

  float skyline = step(p.y * 2.0 + 1.0, h);
  vec3 sky = mix(vec3(0.05, 0.02, 0.15), vec3(0.6, 0.3, 0.5), 0.5 + 0.5 * p.y);
  vec3 mountain = vec3(0.02, 0.01, 0.03);
  vec3 col = mix(sky, mountain, skyline);

  outColor = vec4(col, 1.0);
}
