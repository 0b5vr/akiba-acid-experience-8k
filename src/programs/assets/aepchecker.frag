#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

float sdcapsule(vec2 p, vec2 tail) {
  float t = clamp(dot(p, tail) / dot(tail, tail), 0.0, 1.0);
  return length(p - (tail * t));
}

float sdhalfarc(vec2 p, float r) {
  p.y = abs(p.y);
  return (p.x > 0.0)
    ? abs(length(p) - r)
    : length(p - vec2(0.0, r));
}

float sdAEP(vec2 p) {
  float d = 1e6;

  // A
  d = min(d, sdcapsule(p - vec2(-0.9, 0.4), vec2(0.0, -0.8)) - 0.3);
  d = min(d, sdcapsule(p - vec2(-0.9, 0.4), vec2(-0.8, -0.8)) - 0.3);
  d = max(d, -sdcapsule(p - vec2(-1.1, -0.252), vec2(-0.2, -0.2)) + 0.02);

  // E
  d = min(d, sdcapsule(p - vec2(-0.2, -0.4), vec2(0.5, 0.0)) - 0.3);
  d = max(d, -sdhalfarc(p - vec2(0.3, 0.0), 0.32) + 0.02);
  d = min(d, sdcapsule(p - vec2(-0.2, 0.0), vec2(0.5, 0.0)) - 0.3);
  d = max(d, -sdhalfarc(p - vec2(0.3, 0.4), 0.32) + 0.02);
  d = min(d, sdcapsule(p - vec2(-0.2, 0.4), vec2(0.5, 0.0)) - 0.3);
  d = min(d, sdcapsule(p - vec2(-0.2, 0.4), vec2(0.0, -0.8)) - 0.3);

  // P
  d = min(d, sdcapsule(p - vec2(1.0, 0.4), vec2(0.4, -0.0)) - 0.3);
  d = min(d, sdcapsule(p - vec2(1.0, -0.1), vec2(0.4, -0.0)) - 0.3);
  d = min(d, sdhalfarc(p - vec2(1.4, 0.15), 0.25) - 0.3);
  d = max(d, 0.04 - length(p - vec2(1.32, 0.15)));
  d = min(d, sdcapsule(p - vec2(1.0, 0.4), vec2(0.0, -0.8)) - 0.3);
  d = max(d, -sdcapsule(p - vec2(1.32, -0.25), vec2(0.0, -0.2)) + 0.02);

  return d;
}

float sdChecker(vec2 p) {
  const mat2 ROT = mat2(0.5, 0.5, -0.5, 0.5);
  vec2 i_t = abs(fract(p * ROT) - 0.5);
  return 0.5 - abs(i_t.x + i_t.y);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 pt = p;
  pt.y += 1.2 * fract(0.2 * t);
  pt.x += 2.4 * fract(0.2 * t) * (mod(floor(pt.y / 0.6), 2.0) - 0.5);
  pt = mod(pt, vec2(1.2, 0.6)) - vec2(0.6, 0.3);
  float d = sdAEP(4.0 * pt) / 4.0;

  float color = clamp(0.5 - d / fwidth(d), 0.0, 1.0);

  float bgmask = clamp((d - 0.06) / fwidth(d) + 0.5, 0.0, 1.0);
  float dchecker = sdChecker(6.0 * p + 4.0 * t);
  float bgchecker = clamp(dchecker / fwidth(dchecker) + 0.5, 0.0, 1.0);
  color += bgmask * bgchecker;

  outColor = vec4(vec3(color), 1.0);
}
