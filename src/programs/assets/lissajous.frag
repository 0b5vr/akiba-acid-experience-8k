#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float TAU = acos(-1.0) * 2.0;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float freqA = 3.0;
  float freqB = 2.0 + 0.5 * sin(0.2 * t);
  float phase = t * 0.7;

  float minDist = 1e9;

  const int N = 128;
  for (int i = 0; i < N; i++) {
    float s = float(i) / float(N) * TAU;
    vec2 q = 0.7 * vec2(sin(freqA * s + phase), sin(freqB * s));
    minDist = min(minDist, length(p - q));
  }

  float line = smoothstep(0.02, 0.0, minDist);
  vec3 col = line * vec3(0.2, 1.0, 0.5);

  outColor = vec4(col, 1.0);
}
