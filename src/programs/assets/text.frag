#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D g;

in vec2 v;

out vec4 outColor;

void main() {
  vec3 i_color = vec3(mix(0.9, 1.0, mod(floor(t * 20.0), 2.0)));
  outColor = texture(g, 0.5 + 0.5 * v).x * vec4(i_color, 1.0);
}
