#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 col = vec3(0.0);

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float wave = sin(p.x * 2.0 + t * 0.8 + fi * 2.0) * 0.3;
    float band = smoothstep(0.15, 0.0, abs(p.y - wave - fi * 0.15 + 0.15));
    float hue = fract(0.3 + fi * 0.15 + t * 0.05);
    vec3 c = 0.5 + 0.5 * cos(6.28 * hue + vec3(0, 2, 4));
    col += band * c * 0.6;
  }

  outColor = vec4(col, 1.0);
}
