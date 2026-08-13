#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

vec3 hexCoord(vec2 p) {
  vec2 q = vec2(p.x * 2.0 / 3.0, (-p.x / 3.0 + sqrt(3.0) / 3.0 * p.y));
  return vec3(q.x, -q.x - q.y, q.y);
}

vec2 hexRound(vec3 h) {
  vec3 r = round(h);
  vec3 d = abs(r - h);
  if (d.x > d.y && d.x > d.z) { r.x = -r.y - r.z; }
  else if (d.y > d.z) { r.y = -r.x - r.z; }
  return r.xz;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 hf = hexCoord(p * 8.0);
  vec2 hc = hexRound(hf);

  float dist = length(hc);
  float wave = fract(dist * 0.15 - t * 1.5);
  float pulse = exp(-6.0 * wave);

  vec3 col = pulse * mix(vec3(1.0, 0.6, 0.1), vec3(1.0, 0.9, 0.3), 0.5 + 0.5 * sin(dist));

  outColor = vec4(col, 1.0);
}
