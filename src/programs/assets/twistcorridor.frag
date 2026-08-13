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

float sdBox2D(vec2 p, vec2 s) {
  vec2 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(d.x, d.y));
}

float map(vec3 p) {
  p.xy *= r2d(0.6 * p.z); // 通路自体をZに沿って捩る
  return -sdBox2D(p.xy, vec2(1.0));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0 * t);
  vec3 rd = normalize(vec3(p, -1.3));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 80; i++) {
    dist = map(ro + rd * rl);
    rl += 0.6 * dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 rp = ro + rd * rl;
    float stripe = step(0.5, fract((rp.z + 0.3 * rp.x) * 2.0));
    col = mix(vec3(0.1, 0.8, 1.0), vec3(1.0, 0.2, 0.8), stripe) * exp(-0.05 * rl);
  }

  outColor = vec4(col, 1.0);
}
