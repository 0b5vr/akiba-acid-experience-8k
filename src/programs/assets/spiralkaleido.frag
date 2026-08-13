#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);

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

  float r = length(p);
  float a = atan(p.y, p.x);
  float n = 7.0;

  float spiralA = a + log(r + 0.1) * 2.0 + t;
  spiralA = abs(mod(spiralA, 2.0 * PI / n) - PI / n);
  vec2 fp = r * vec2(cos(spiralA), sin(spiralA));

  vec3 noise = cyclic(vec3(fp * 3.0, t * 0.3), 0.5, 2.0);
  vec3 col = 0.5 + 0.5 * noise;

  outColor = vec4(col, 1.0);
}
