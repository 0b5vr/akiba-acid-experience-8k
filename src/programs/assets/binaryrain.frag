#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 grid = vec2(40.0, 24.0);
  vec2 cell = floor(p * grid);

  float colSpeed = 2.0 + 3.0 * hash(vec2(cell.x, 0.0));
  float headY = fract(t * colSpeed * 0.3 + hash(vec2(cell.x, 1.0)) * 10.0) * grid.y;
  float dist = headY - cell.y;
  float trail = exp(-0.15 * max(dist, 0.0)) * step(0.0, dist);

  float glyph = step(0.5, hash(cell + floor(t * 8.0)));
  vec3 col = glyph * trail * vec3(0.1, 1.0, 0.2);

  outColor = vec4(col, 1.0);
}
