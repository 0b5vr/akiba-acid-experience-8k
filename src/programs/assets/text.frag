#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform sampler2D g;

out vec4 outColor;

void main() {
  outColor = texture(g, 0.5 + 0.5 * v);
}
