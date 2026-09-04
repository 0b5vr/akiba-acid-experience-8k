#version 300 es

//[
precision highp float;
//]

uniform sampler2D f;

in vec2 v;

out vec4 outColor;

void main() {
  outColor = texture(f, v * 0.5 + 0.5);
}
