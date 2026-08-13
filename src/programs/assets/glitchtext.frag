#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D g;

in vec2 v;

out vec4 outColor;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

void main() {
  vec2 uv = 0.5 + 0.5 * v;

  // 横帯ごとにたまにジッターさせる
  float block = floor(uv.y * 24.0 + floor(t * 6.0) * 7.0);
  float jitterGate = step(0.75, hash(block * 3.1 + floor(t * 10.0)));
  float jitter = (hash(block + floor(t * 10.0)) - 0.5) * 0.06 * jitterGate;

  vec2 uvJ = uv + vec2(jitter, 0.0);

  float rSplit = 0.006 + 0.01 * step(0.9, hash(floor(t * 8.0)));

  float r = texture(g, uvJ + vec2(rSplit, 0.0)).x;
  float gCh = texture(g, uvJ).x;
  float b = texture(g, uvJ - vec2(rSplit, 0.0)).x;

  outColor = vec4(r, gCh, b, 1.0);
}
