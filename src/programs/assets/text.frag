#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D g;

in vec2 v;

out vec4 outColor;

void main() {
  outColor = texture(g, 0.5 + 0.5 * v) * mix(0.8, 1.0, mod(floor(t * 20.0), 2.0));
}
