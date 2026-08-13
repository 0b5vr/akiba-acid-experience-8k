#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec4 map(vec3 p) {
  vec2 cell = floor(p.xz);
  vec3 pt = p;
  pt.xz = fract(p.xz) - 0.5;

  float phase = fract(t * BPS / 2.0 - hash(cell) * 0.4);
  float height = 0.15 + 0.65 * smoothstep(0.0, 0.15, phase) * (1.0 - smoothstep(0.15, 0.5, phase));

  pt.y -= height - 1.0;
  float d = sdbox(pt, vec3(0.35, height, 0.35));

  return vec4(d, cell, height);
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx).x - map(p - d.yxx).x,
    map(p + d.xyx).x - map(p - d.xyx).x,
    map(p + d.xxy).x - map(p - d.xxy).x
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  // ほぼ真上から見下ろす疑似正射影カメラ(domain repeatとの相性が良い)
  vec3 ro = vec3(3.0 * p.x, 5.0, 3.0 * p.y + 1.5);
  vec3 rd = normalize(vec3(0.0, -1.0, 0.3));

  float rl = 0.0;
  vec4 isect = vec4(0.0);

  for (int i = 0; i < 50; i++) {
    isect = map(ro + rd * rl);
    rl += 0.7 * isect.x;
  }

  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (isect.x < 0.02) {
    vec3 rp = ro + rd * rl;
    vec3 n = nMap(rp);
    const vec3 L = normalize(vec3(0.5, 1.0, 0.3));

    float diff = max(dot(n, L), 0.0);
    vec3 base = mix(vec3(1.0, 0.2, 0.6), vec3(0.2, 0.9, 1.0), fract(hash(isect.yz) * 3.0));

    vec3 col = base * (0.2 + 0.8 * diff);

    outColor = vec4(col, 1.0);
  }
}
