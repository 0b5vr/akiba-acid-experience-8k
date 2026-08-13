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

  vec2 src1 = vec2(-0.4, 0.0);
  vec2 src2 = vec2(0.4, 0.0);
  float freq = BPS * 4.0;

  float w1 = sin(length(p - src1) * 10.0 - t * freq);
  float w2 = sin(length(p - src2) * 10.0 - t * freq);
  float inter = (w1 + w2) * 0.5;

  vec3 col = vec3(0.5 + 0.5 * inter) * vec3(0.3, 0.6, 1.0);

  outColor = vec4(col, 1.0);
}
