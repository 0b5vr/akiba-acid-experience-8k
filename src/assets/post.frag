#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform sampler2D f;

out vec4 outColor;

void main() {
  vec2 uv = 0.5 + 0.5 * v;
  vec4 col = texture(f, uv);

  float vignette = 1.0 - 0.5 * dot(v, v);
  col.rgb *= vignette;

  outColor = col;
}
