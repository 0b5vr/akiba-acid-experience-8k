#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 sun = 0.6 * vec2(cos(t * 0.3), sin(t * 0.2));
  vec3 col = vec3(0.0);

  float sunGlow = 0.02 / length(p - sun);
  col += sunGlow * vec3(1.0, 0.9, 0.7);

  for (int i = 1; i <= 6; i++) {
    float fi = float(i);
    vec2 flarePos = mix(vec2(0.0), -sun, fi / 6.0 * 1.5);
    float d = length(p - flarePos);
    float ring = smoothstep(0.08, 0.0, abs(d - 0.05 * fi)) * 0.3;
    col += ring * vec3(0.6, 0.8, 1.0) / fi;
  }

  outColor = vec4(col, 1.0);
}
