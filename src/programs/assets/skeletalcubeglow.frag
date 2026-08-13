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

float sdBoxFrame(vec3 p, vec3 b, float e) {
  p = abs(p) - b;
  vec3 q = abs(p + e) - e;
  return min(min(
    length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
    length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
    length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.7));
  rd.xy *= r2d(t * 0.2);
  rd.yz *= r2d(t * 0.15);

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 60; i++) {
    dist = sdBoxFrame(ro + rd * rl, vec3(0.8), 0.03);
    rl += dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.005) {
    col = vec3(0.5, 0.6, 0.9) * exp(-0.1 * rl);
  }

  // 内部で跳ねる光球(疑似グロー)
  vec3 ballPos = 0.5 * vec3(sin(t * 1.7), sin(t * 2.1 + 1.0), sin(t * 1.3 + 2.0));
  vec3 toBall = ballPos - ro;
  float projLen = dot(toBall, rd);
  vec3 closest = ro + rd * projLen;
  float ballDist = length(closest - ballPos);
  float glow = exp(-30.0 * ballDist) * step(0.0, projLen);
  col += glow * vec3(1.0, 0.9, 0.5);

  outColor = vec4(col, 1.0);
}
