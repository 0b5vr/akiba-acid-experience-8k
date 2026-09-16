#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float wave = length(p) * sin(8.0 * (atan(p.y, p.x) - 1.5 * t + log(length(p))));

  float shape = clamp(wave * 10.0, 0.0, 1.0);
  vec3 col = vec3(shape);

  outColor = vec4(col, 1.0);
}
