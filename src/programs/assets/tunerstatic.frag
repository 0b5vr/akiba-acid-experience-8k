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

  vec2 noiseUv = p * 400.0 + t * 400.0;
  float staticNoise = hash(floor(noiseUv));

  float barPos = fract(t * 0.15);
  float bar = smoothstep(0.05, 0.0, abs(p.y - (barPos * 2.0 - 1.0)));

  vec3 col = vec3(staticNoise);
  col = mix(col, vec3(0.1, 0.8, 1.0), bar * 0.5);

  outColor = vec4(col, 1.0);
}
