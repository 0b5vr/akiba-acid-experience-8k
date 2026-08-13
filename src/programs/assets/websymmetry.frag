#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float r = length(p);
  float a = atan(p.y, p.x);

  float spokeAngle = abs(mod(a, PI / 4.0) - PI / 8.0);
  float spokes = smoothstep(0.06, 0.0, spokeAngle * r);

  float ringPhase = fract(r * 4.0 - t);
  float rings = smoothstep(0.06, 0.0, abs(ringPhase - 0.5) - 0.44);

  float web = max(spokes, rings);
  vec3 col = web * mix(vec3(0.8, 0.9, 1.0), vec3(1.0), 0.5 + 0.5 * sin(r * 10.0 - t * 4.0));

  outColor = vec4(col, 1.0);
}
