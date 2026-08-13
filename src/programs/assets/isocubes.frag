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

  // 疑似等角座標変換
  vec2 iso = vec2(p.x * 0.866 + p.y * 0.5, -p.x * 0.866 + p.y * 0.5) * 4.0;
  vec2 cell = floor(iso);
  vec2 local = fract(iso) - 0.5;

  float height = 0.5 + 0.5 * sin(t * BPS * 0.5 + cell.x * 0.6 + cell.y * 0.6);
  float top = step(abs(local.x) + abs(local.y), 0.5 - 0.05);

  vec3 topCol = mix(vec3(0.3, 0.2, 0.6), vec3(0.9, 0.7, 1.0), height);
  vec3 col = top * topCol;

  outColor = vec4(col, 1.0);
}
