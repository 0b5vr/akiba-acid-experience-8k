#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 grid = fract(p * 8.0);

  float scanY = fract(t * BPS / 4.0) * 2.0 - 1.0;
  float dist = p.y - scanY;
  float wipe = step(0.0, dist);

  vec3 base = vec3(0.05);
  vec3 lit = vec3(0.9, 1.0, 0.95);

  float lineGlow = smoothstep(0.05, 0.0, abs(dist));

  vec3 col = mix(lit, base, wipe);
  col += lineGlow * vec3(0.5, 1.0, 1.0);

  // グリッド線
  float gridLine = step(0.95, grid.x) + step(0.95, grid.y);
  col *= 1.0 - 0.3 * clamp(gridLine, 0.0, 1.0);

  outColor = vec4(col, 1.0);
}
