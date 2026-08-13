#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float n = 6.0;
  float a = atan(p.y, p.x);
  a = abs(mod(a, 2.0 * PI / n) - PI / n);
  float r = length(p);
  vec2 fp = r * vec2(cos(a), sin(a));

  float growthR = 0.15 + 0.7 * fract(t * 0.15);
  float branchNoise = hash(floor(fp * 20.0));
  float branches = step(0.6, branchNoise) * smoothstep(growthR + 0.05, growthR - 0.05, fp.x);

  vec3 col = branches * vec3(0.7, 0.9, 1.0);

  outColor = vec4(col, 1.0);
}
