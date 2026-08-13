#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 p1 = p * r2d(0.3 * t);
  vec2 p2 = p * r2d(-0.3 * t + 0.4);

  float rings1 = 0.5 + 0.5 * sin(length(p1) * 60.0);
  float rings2 = 0.5 + 0.5 * sin(length(p2) * 60.0);

  float moirePattern = rings1 * rings2;
  vec3 col = vec3(smoothstep(0.3, 0.7, moirePattern));

  outColor = vec4(col, 1.0);
}
