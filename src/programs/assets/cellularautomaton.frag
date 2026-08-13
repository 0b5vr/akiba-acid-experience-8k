#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 cell = floor(p * 10.0);
  float generation = floor(t * 2.0);

  // 近傍セルとgenerationのhashで生存判定するライフゲーム風の疑似ルール
  float alive = 0.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 nc = cell + vec2(float(dx), float(dy));
      alive += step(0.55, hash(vec3(nc, generation)));
    }
  }

  float lit = step(2.5, alive) * step(alive, 3.5);
  vec3 col = lit * mix(vec3(0.1, 1.0, 0.3), vec3(0.8, 1.0, 0.1), hash(vec3(cell, generation)));

  outColor = vec4(col, 1.0);
}
