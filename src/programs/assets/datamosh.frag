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
  vec2 uv = 0.5 + 0.5 * v;

  float row = floor(uv.y * 40.0);
  float shiftSeed = hash(vec2(row, floor(t * 8.0)));
  float shift = (shiftSeed - 0.5) * step(0.7, shiftSeed) * 0.4;

  vec2 suv = uv + vec2(shift, 0.0);
  vec2 cell = floor(suv * vec2(60.0, 40.0));
  float blockNoise = hash(cell + floor(t * 8.0));

  outColor = vec4(vec3(blockNoise), 1.0);
}
