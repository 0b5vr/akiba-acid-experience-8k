#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

void main() {
  float beat = floor(t * BPS * 2.0);
  float state = hash(beat);
  float flash = step(0.7, state);

  outColor = vec4(vec3(flash), 1.0);
}
