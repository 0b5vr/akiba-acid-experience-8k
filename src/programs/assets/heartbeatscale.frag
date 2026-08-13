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

  // 心拍っぽい二段階パルス波形(lub-dub)
  float beat = fract(t * 1.2);
  float pulse = exp(-30.0 * beat) + 0.6 * exp(-30.0 * abs(beat - 0.15));
  float scale = 1.0 + 0.15 * pulse;
  vec2 sp = p / scale;

  vec3 noise = cyclic(vec3(sp * 2.0, t * 0.2), 0.5, 2.0);
  float shape = smoothstep(0.5, 0.3, length(sp)) * smoothstep(-0.2, 0.4, noise.x);

  vec3 col = shape * mix(vec3(0.3, 0.0, 0.05), vec3(1.0, 0.1, 0.2), pulse);

  outColor = vec4(col, 1.0);
}
