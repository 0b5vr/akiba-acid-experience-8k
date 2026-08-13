#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 uv = p * 4.0;
  vec2 cell = floor(uv);

  float minDist = 1e9;
  vec2 minCellId = vec2(0.0);
  vec2 minCellCenter = vec2(0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 cellId = cell + neighbor;
      vec2 point = cellId + hash2(cellId);

      float d = length(point - uv);
      if (d < minDist) {
        minDist = d;
        minCellId = cellId;
        minCellCenter = point;
      }
    }
  }

  // ビートに同期してセルごとにずれたタイミングでシャッターが開閉
  float phase = fract(t * BPS / 2.0 + hash2(minCellId).x);
  float openness = smoothstep(0.0, 0.15, phase) - smoothstep(0.4, 0.55, phase);

  float distFromCenter = length(uv - minCellCenter);
  float shutter = step(distFromCenter, openness * 0.7);

  outColor = vec4(vec3(shutter), 1.0);
}
