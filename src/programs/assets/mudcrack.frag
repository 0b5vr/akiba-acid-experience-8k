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

float voronoiEdge(vec2 uv) {
  vec2 cell = floor(uv);
  float minDist = 1e9;
  float secondDist = 1e9;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = cell + neighbor + hash2(cell + neighbor);
      float d = length(point - uv);
      if (d < minDist) {
        secondDist = minDist;
        minDist = d;
      } else if (d < secondDist) {
        secondDist = d;
      }
    }
  }

  return secondDist - minDist;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float edge = voronoiEdge(p * 6.0);
  float crackOpen = 0.5 + 0.5 * sin(t * BPS * 0.5);
  float crack = smoothstep(0.02 * crackOpen, 0.0, edge);

  vec3 col = mix(vec3(0.5, 0.35, 0.2), vec3(0.05, 0.02, 0.0), crack);

  outColor = vec4(col, 1.0);
}
