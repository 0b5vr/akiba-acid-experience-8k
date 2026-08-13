#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float sdStar(vec2 p, float r, float amp, float n) {
  float a = atan(p.y, p.x);
  float rr = r * (1.0 + amp * cos(n * a));
  return length(p) - rr;
}

float map(vec3 p) {
  float wall = -sdStar(p.xy, 1.0, 0.35, 5.0);

  float zcell = floor(p.z + 0.5);
  float pz = p.z - zcell;
  float ringD = -sdStar(p.xy, 0.9, 0.35, 5.0);
  float ring = length(vec2(ringD, pz)) - 0.03;

  return min(wall, ring);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0 * t);
  vec3 rd = normalize(vec3(p, -1.3));
  rd.xy *= r2d(0.2 * t);

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 80; i++) {
    dist = map(ro + rd * rl);
    rl += 0.6 * dist;
  }

  float strobe = step(0.5, fract(t * 4.0));

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 base = strobe > 0.5 ? vec3(1.0, 1.0, 0.2) : vec3(1.0, 0.1, 0.1);
    col = base * exp(-0.06 * rl);
  }

  outColor = vec4(col, 1.0);
}
