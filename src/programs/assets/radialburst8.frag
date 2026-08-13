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
  float a = atan(p.y, p.x) + t * 0.5;
  float seg = mod(a, PI / 4.0) - PI / 8.0;
  float beam = smoothstep(0.4, 0.0, abs(seg) * r);
  float pulse = 0.5 + 0.5 * sin(t * 4.0 - r * 3.0);

  vec3 col = beam * pulse * vec3(1.0, 0.5, 0.1);

  outColor = vec4(col, 1.0);
}
