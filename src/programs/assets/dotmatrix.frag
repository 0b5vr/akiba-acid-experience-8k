#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = 2.0 * PI;

// Ref: https://www.shadertoy.com/view/XlXcW4
vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

vec2 cis(float t) {
  return vec2(cos(t), sin(t));
}

vec2 boxmuller(vec2 xi) {
  float r = sqrt(-2.0 * log(xi.x));
  float t = xi.y;
  return r * cis(TAU * t);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  p += 0.1 * p * length(p);
  p *= 16.0;

  vec2 cell = floor(p + 0.5);
  float d = length(p - cell);
  float shape = smoothstep(0.5, 0.4, d);
  shape *= cell.y == floor(4.0 * boxmuller(hash3f(vec3(cell.xx, t)).xy).x + 0.5) ? 1.0 : 0.1;
  outColor = vec4(vec3(shape), 1.0);
}
