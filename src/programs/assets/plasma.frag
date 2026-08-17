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

  float x = p.x;
  float y = p.y;

  float i_plasma = (
    sin(t + 4.0 * x)
    + sin(t + 240.0 * y) * 0.1
    + sin(t + 5.0 * x) * sin(t + 5.0 * y)
    + sin(t + 8.0 * (x * sin(t + t / 2.0) + y * cos(t / 3.0)))
    + sin(t + 7.0 * length(p + vec2(sin(t / 3.0), cos(t / 2.0))) + 3.0 * t)
  );

  vec3 i_col = 0.5 + 0.5 * sin(2.0 * i_plasma + vec3(0.0, 1.5, 2.5));

  outColor = vec4(i_col, 1.0);
}
