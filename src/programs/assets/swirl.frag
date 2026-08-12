#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

mat2 rotate2D(float t) {
  float c = cos(t), s = sin(t);
  return mat2(c, s, -s, c);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  p *= rotate2D(t + log(length(p)));
  float wave = length(p) * sin(8.0 * atan(p.y, p.x));

  float shape = clamp(wave * 10.0, 0.0, 1.0);
  vec3 col = vec3(shape);

  outColor = vec4(col, 1.0);
}
