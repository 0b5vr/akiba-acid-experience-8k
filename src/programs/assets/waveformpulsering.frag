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

  float r = length(p);
  float beat = t * BPS;
  float kickPhase = fract(beat);
  float ringR = kickPhase * 1.5;

  float ring = smoothstep(0.03, 0.0, abs(r - ringR));
  float fade = 1.0 - kickPhase;

  vec3 col = ring * fade * vec3(0.2, 0.8, 1.0);

  outColor = vec4(col, 1.0);
}
