#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float r = length(p);
  float a = atan(p.y, p.x);
  float m = 3.0;
  float n = 5.0;

  float pattern = cos(m * a) * sin(n * PI * r + t * 2.0);
  float sand = smoothstep(0.05, 0.0, abs(pattern));

  vec3 col = sand * vec3(0.9, 0.85, 0.6);

  outColor = vec4(col, 1.0);
}
