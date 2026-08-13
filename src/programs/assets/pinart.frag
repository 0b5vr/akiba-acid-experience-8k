#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 cell = floor(p * 14.0);
  vec2 local = fract(p * 14.0) - 0.5;

  float wave = sin(length(cell) * 0.5 - t * 3.0);
  float height = 0.5 + 0.5 * wave;

  float pinRadius = 0.15 + 0.25 * height;
  float pin = smoothstep(pinRadius, pinRadius - 0.05, length(local));

  vec3 col = pin * mix(vec3(0.15), vec3(1.0), height);

  outColor = vec4(col, 1.0);
}
