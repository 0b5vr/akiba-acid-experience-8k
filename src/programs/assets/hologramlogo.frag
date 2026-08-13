#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D g;

in vec2 v;

out vec4 outColor;

void main() {
  vec2 uv = 0.5 + 0.5 * v;
  float mask = texture(g, uv).x;

  float scan = 0.5 + 0.5 * sin(v.y * 40.0 - t * 8.0);
  vec3 holo = 0.5 + 0.5 * cos(6.0 * v.x + vec3(0, 2, 4) + t * 2.0);

  vec3 col = mask * holo * (0.6 + 0.4 * scan);

  outColor = vec4(col, 1.0);
}
