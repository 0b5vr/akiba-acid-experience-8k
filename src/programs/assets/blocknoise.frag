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

  vec2 macroCell = floor(p * 8.0);
  float corrupt = step(0.7, hash(macroCell + floor(t * 3.0)));

  vec2 blockSize = corrupt > 0.5 ? vec2(40.0) : vec2(4.0);
  vec2 cell = floor(p * blockSize);
  float blockCol = hash(cell + floor(t * 2.0));

  vec3 col = vec3(blockCol);
  col = mix(col, vec3(blockCol, blockCol * 0.5, 1.0 - blockCol), corrupt);

  outColor = vec4(col, 1.0);
}
