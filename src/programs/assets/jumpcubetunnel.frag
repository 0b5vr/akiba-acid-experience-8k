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

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float map(vec3 p) {
  vec3 cell = floor(p);

  vec3 pt = p;
  pt.xy *= r2d(0.2 * pt.z + 0.2 * t);
  pt.z -= fract(2.0 * t);
  pt = fract(pt) - 0.5;

  float blinkPhase = fract(t * 3.0 + hash(cell) * 10.0);
  float visible = step(0.5, blinkPhase);

  float d = length(pt) - 0.3;
  return mix(1e3, d, visible);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0);
  vec3 rd = normalize(vec3(p, -2.0));
  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 80; i++) {
    dist = map(ro + rd * rl);
    rl += dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 rp = ro + rd * rl;
    vec3 cell = floor(rp);
    col = mix(vec3(1.0, 0.2, 0.3), vec3(0.2, 1.0, 0.9), hash(cell)) * exp(-0.15 * rl);
  }

  outColor = vec4(col, 1.0);
}
