#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

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

  vec3 rd = normalize(vec3(p, -1.0));

  float rl = 1.0 / abs(rd.y);
  vec3 rp = rd * rl;
  rp.z -= 5.0 * t;

  if (rd.y > 0.0) {
    float i_noise = 0.5 + 0.5 * cyclic(vec3(vec2(1.6, 0.4) * rp.xz, 0.0), 0.5, 2.0).x;
    outColor = vec4(mix(vec3(0, 0, 1), vec3(1), i_noise), 1.0);
  } else {
    float i_checker = step(0.0, sin(3.0 * rp.x) * sin(3.0 * rp.z));
    outColor = vec4(vec3(i_checker), 1.0);
  }

  outColor.rgb += vec3(0.01, 0.02, 0.03) * rl;
}
