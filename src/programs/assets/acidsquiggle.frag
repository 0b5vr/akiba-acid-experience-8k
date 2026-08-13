#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float minDist = 1e9;
  vec2 prev = vec2(-1.5, 0.0);
  const int N = 100;

  for (int i = 1; i <= N; i++) {
    float s = float(i) / float(N);
    float x = -1.5 + 3.0 * s;
    float cutoff = 0.3 + 0.6 * fract(t * BPS / 4.0);
    float y = 0.5 * sin(x * 8.0 + t * 3.0) * cutoff + 0.2 * sin(x * 20.0 - t * 5.0) * (1.0 - cutoff);
    vec2 cur = vec2(x, y);

    vec2 pa = p - prev, ba = cur - prev;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    minDist = min(minDist, length(pa - ba * h));
    prev = cur;
  }

  float line = smoothstep(0.02, 0.0, minDist);
  vec3 col = line * vec3(0.3, 1.0, 0.2);

  outColor = vec4(col, 1.0);
}
