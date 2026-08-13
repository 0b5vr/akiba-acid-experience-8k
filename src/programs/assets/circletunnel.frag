#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float TAU = acos(-1.0) * 2.0;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

// トンネル内壁 + 等間隔ネオンリングのSDF(内側が正)
float map(vec3 p) {
  float r = 1.0;
  float wall = r - length(p.xy);

  float zcell = floor(p.z + 0.5);
  float pz = p.z - zcell;
  float ringR = r - 0.06;
  float ring = length(vec2(length(p.xy) - ringR, pz)) - 0.03;

  return min(wall, ring);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0 * t);
  vec3 rd = normalize(vec3(p, -1.3));
  rd.xy *= r2d(0.15 * sin(0.3 * t));

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
    float theta = atan(rp.y, rp.x) + rp.z * 0.3;
    float stripe = step(0.5, fract(theta * 6.0 / TAU));
    vec3 base = mix(vec3(1.0, 0.1, 0.6), vec3(0.1, 0.9, 1.0), hueSeed);
    col = base * (0.3 + 0.7 * stripe);
    col *= exp(-0.05 * rl);
  }

  outColor = vec4(col, 1.0);
}
