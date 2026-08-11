#version 300 es

//[
precision highp float;
//]

in vec2 v;

out vec4 outColor;

void main() {
  vec2 p = v;
  p.x = abs(p.x) * 16.0 / 9.0;

  float d = abs(length(p) - 0.8) - 0.02;

  float i_dmouse = abs(length(p) - 0.55);
  float theta = atan(p.x, -p.y);
  float i_width = mix(0.15, 0.05, smoothstep(0.0, 1.6, theta)) * cos(clamp(30.0 * (theta - 1.4), -1.3, 1.6));
  d = min(d, i_dmouse - i_width);

  p -= vec2(0.2, 0.3);
  p.y *= 0.3;
  d = min(d, length(p) - 0.08);

  float shape = max(-d * 540.0, 0.0);
  outColor = vec4(vec3(shape), 1.0);
}
