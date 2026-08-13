#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 cell = floor(p * 5.0);
  float beat = t * BPS;
  float kick = fract(beat);
  float flash = exp(-8.0 * kick);

  float rnd = hash(cell + floor(beat));
  float lit = step(0.5, rnd) * flash;

  outColor = vec4(vec3(lit), 1.0);
}
