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

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float d = 1e9;
  vec2 pos = vec2(-1.4, 0.3 * sin(t));

  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    vec2 dir = cyclic(vec3(pos * 1.5, t * 0.5 + fi * 0.1), 0.5, 2.0).xy;
    vec2 next = pos + normalize(dir + vec2(0.7, 0.0)) * 0.08;
    d = min(d, sdSeg(p, pos, next));
    pos = next;
  }

  float line = smoothstep(0.015, 0.0, d);
  vec3 col = line * vec3(1.0, 0.6, 0.1);

  outColor = vec4(col, 1.0);
}
