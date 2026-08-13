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

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float growth() {
  return 0.5 + 0.5 * sin(t * 0.5);
}

float branch(vec2 p, vec2 origin, vec2 dir, float len, int depth) {
  float d = 1e9;
  vec2 cur = origin;
  vec2 curDir = dir;
  float curLen = len;

  for (int i = 0; i < 6; i++) {
    if (i >= depth) { break; }
    vec2 next = cur + curDir * curLen * growth();
    d = min(d, sdSeg(p, cur, next));
    cur = next;
    curDir *= r2d(0.5 * sin(float(i) * 2.3 + t));
    curLen *= 0.7;
  }

  return d;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;
  vec2 pp = p - vec2(0.0, -0.9);

  float d = 1e9;
  d = min(d, branch(pp, vec2(0.0), vec2(0.0, 1.0), 0.6, 6));
  d = min(d, branch(pp, vec2(0.0, 0.3), vec2(-0.5, 0.7), 0.35, 4));
  d = min(d, branch(pp, vec2(0.0, 0.3), vec2(0.5, 0.7), 0.35, 4));
  d = min(d, branch(pp, vec2(0.0, 0.55), vec2(-0.3, 0.9), 0.25, 3));
  d = min(d, branch(pp, vec2(0.0, 0.55), vec2(0.3, 0.9), 0.25, 3));

  float line = smoothstep(0.02, 0.0, d);
  vec3 col = line * vec3(0.3, 1.0, 0.4);

  outColor = vec4(col, 1.0);
}
