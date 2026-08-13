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

  float lineNoise = hash(vec2(floor(uv.y * 300.0), floor(t * 20.0)));
  float jitter = (lineNoise - 0.5) * 0.02 * step(0.85, lineNoise);
  uv.x += jitter;

  float trackingBand = smoothstep(0.0, 0.05, abs(fract(uv.y * 3.0 - t * 0.3) - 0.5) - 0.45);
  float staticNoise = hash(uv * vec2(800.0, 600.0) + t);

  vec3 col = vec3(0.7 + 0.3 * staticNoise);
  col = mix(col, vec3(1.0), (1.0 - trackingBand) * 0.5);

  outColor = vec4(col, 1.0);
}
