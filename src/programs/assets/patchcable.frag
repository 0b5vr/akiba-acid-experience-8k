#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

vec2 nodePos(float i) {
  return vec2(hash(i) * 2.0 - 1.0, hash(i + 50.0) * 2.0 - 1.0) * 0.8;
}

float bezierDist(vec2 p, vec2 a, vec2 b, vec2 c) {
  float minD = 1e9;
  vec2 prev = a;

  for (int i = 1; i <= 20; i++) {
    float s = float(i) / 20.0;
    vec2 cur = mix(mix(a, b, s), mix(b, c, s), s);
    vec2 pa = p - prev, ba = cur - prev;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    minD = min(minD, length(pa - ba * h));
    prev = cur;
  }

  return minD;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float d = 1e9;
  const int NCABLE = 6;

  for (int i = 0; i < NCABLE; i++) {
    float fi = float(i);
    vec2 a = nodePos(fi);
    vec2 b = nodePos(fi + 10.0);
    vec2 mid = (a + b) * 0.5 + vec2(0.0, -0.3 * sin(t * 1.5 + fi)) * 0.5;
    d = min(d, bezierDist(p, a, mid, b));
  }

  float line = smoothstep(0.015, 0.0, d);
  vec3 col = line * vec3(1.0, 0.5, 0.1);

  outColor = vec4(col, 1.0);
}
