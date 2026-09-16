#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

float sdsmiley(vec2 p) {
  p.x = abs(p.x);

  float i_dmouse = abs(length(p) - 0.55);
  float theta = atan(p.x, -p.y);
  float i_width = mix(0.15, 0.05, smoothstep(0.0, 1.6, theta)) * cos(clamp(30.0 * (theta - 1.4), -1.3, 3.1));
  float d = i_dmouse - i_width;

  p -= vec2(0.2, 0.3);
  p.y *= 0.3;
  d = min(d, length(p) - 0.08);

  return d;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  p.x -= clamp(round(p.x), -1.0, 1.0);

  float i_d = max(length(p) - 0.4, -sdsmiley(p * 2.0) / 2.0);

  float shape = max(-i_d * 540.0, 0.0);
  outColor = shape * vec4(fract(15.0 * t) < 0.5 ? vec3(1, 1, 0) : vec3(0, 0, 1), 1.0);
}
