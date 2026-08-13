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

  float barrel = length(p) * 0.15;
  vec2 pb = p * (1.0 + barrel * barrel);

  vec3 noise = cyclic(vec3(pb * 2.0, t * 0.3), 0.5, 2.0);
  float base = smoothstep(-0.2, 0.6, noise.x);

  float scanline = 0.85 + 0.15 * sin(p.y * 400.0);
  vec3 col = base * scanline * vec3(0.2, 1.0, 0.3);
  col *= 1.0 - 0.3 * dot(p, p);

  outColor = vec4(col, 1.0);
}
