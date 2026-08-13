#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float sdBar(vec2 p, vec2 a, vec2 b, float w) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - w;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;
  p *= r2d(t * 0.2);
  p *= 2.2;

  vec2 v1 = vec2(0.0, 1.0), v2 = vec2(-0.866, -0.5), v3 = vec2(0.866, -0.5);

  float bar1 = sdBar(p, v1, v2, 0.18);
  float bar2 = sdBar(p, v2, v3, 0.18);
  float bar3 = sdBar(p, v3, v1, 0.18);

  float shape = min(min(bar1, bar2), bar3);
  float line = smoothstep(0.02, 0.0, shape);

  vec3 col = line * mix(vec3(1.0, 0.3, 0.1), vec3(0.1, 0.6, 1.0), 0.5 + 0.5 * sin(atan(p.y, p.x) * 3.0 + t));

  outColor = vec4(col, 1.0);
}
