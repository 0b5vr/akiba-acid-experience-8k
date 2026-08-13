#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = PI * 2.0;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float a = atan(p.y, p.x);
  float sweepAngle = mod(t * 3.0, TAU) - PI;
  float diff = abs(mod(a - sweepAngle + PI, TAU) - PI);

  float beam = smoothstep(0.5, 0.0, diff);
  float strobe = step(0.5, fract(t * 8.0));

  vec3 col = beam * strobe * vec3(1.0, 1.0, 0.9);

  outColor = vec4(col, 1.0);
}
