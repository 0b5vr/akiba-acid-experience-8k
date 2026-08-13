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

// Ref: https://iquilezles.org/articles/distfunctions2d/
float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

// 六角形トンネルの内壁 + 等間隔ネオンリングのSDF(内側が正)
float map(vec3 p) {
  float wall = -sdHexagon(p.xy, 1.0);

  float zcell = floor(p.z + 0.5);
  float pz = p.z - zcell;
  float ringD = -sdHexagon(p.xy, 0.94);
  float ring = length(vec2(ringD, pz)) - 0.03;

  return min(wall, ring);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0 * t);
  vec3 rd = normalize(vec3(p, -1.3));
  rd.xy *= r2d(0.3 * t);

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 80; i++) {
    dist = map(ro + rd * rl);
    rl += 0.6 * dist;
  }

  vec3 rp = ro + rd * rl;
  float zcell = floor(rp.z + 0.5);
  float hueSeed = hash(zcell);

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 base = mix(vec3(1.0, 0.8, 0.1), vec3(0.1, 1.0, 0.6), hueSeed);
    col = base * exp(-0.06 * rl);
  }

  outColor = vec4(col, 1.0);
}
