#version 300 es

//[
precision highp float;
//]

in vec2 v;

out vec4 outColor;

float sdsmiley(vec2 p) {
  p.x = abs(p.x);

  float i_dmouse = abs(length(p) - 0.55);
  float theta = atan(p.x, -p.y);
  float i_width = mix(0.15, 0.05, smoothstep(0.0, 1.6, theta)) * cos(clamp(30.0 * (theta - 1.4), -1.3, 3.1));
  float d = min(i_dmouse - i_width, abs(length(p) - 0.8) - 0.02);

  p -= vec2(0.2, 0.3);
  p.y *= 0.3;
  d = min(d, length(p) - 0.08);

  return d;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float i_d = sdsmiley(p);

  float shape = max(-i_d * 540.0, 0.0);
  outColor = shape * vec4(1.0);
}
