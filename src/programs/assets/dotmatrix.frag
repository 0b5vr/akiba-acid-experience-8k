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
  vec2 grid = vec2(48.0, 27.0);

  vec2 cell = floor(uv * grid);
  vec2 cellCenter = (cell + 0.5) / grid;
  float mask = texture(g, cellCenter).x;

  vec2 local = fract(uv * grid) - 0.5;
  float dotShape = smoothstep(0.42, 0.35, length(local));

  float flicker = 0.85 + 0.15 * sin(t * 30.0 + cell.x * 3.0 + cell.y * 7.0);

  vec3 col = mask * dotShape * flicker * vec3(1.0, 0.15, 0.1);

  outColor = vec4(col, 1.0);
}
