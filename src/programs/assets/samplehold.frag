#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float steps = 16.0;
  float x01 = p.x * 0.5 + 0.5;
  float stepIdx = floor(x01 * steps);
  float held = hash(stepIdx + floor(t * 4.0)) * 2.0 - 1.0;

  float line = smoothstep(0.05, 0.0, abs(p.y - held * 0.7));
  float stepLine = smoothstep(0.5, 0.48, abs(fract(x01 * steps) - 0.5));

  vec3 col = line * vec3(1.0, 0.8, 0.1);
  col += stepLine * vec3(0.05, 0.05, 0.08);

  outColor = vec4(col, 1.0);
}
