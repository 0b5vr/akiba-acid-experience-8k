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

  vec2 qrArea = vec2(0.6);
  vec2 uv = (p + qrArea) / (2.0 * qrArea);

  vec2 grid = vec2(21.0);
  vec2 cell = floor(uv * grid);
  float inBounds = step(0.0, cell.x) * step(cell.x, grid.x - 1.0) * step(0.0, cell.y) * step(cell.y, grid.y - 1.0);

  float qrBit = step(0.5, hash(cell));

  float scanY = fract(t * 0.4) * grid.y;
  float scanGlitch = smoothstep(1.0, 0.0, abs(cell.y - scanY)) * step(0.5, hash(cell + floor(t * 10.0)));

  float bit = mix(qrBit, 1.0 - qrBit, scanGlitch);
  vec3 col = inBounds * bit * vec3(1.0);

  outColor = vec4(col, 1.0);
}
