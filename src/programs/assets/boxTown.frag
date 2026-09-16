#version 300 es

//[
precision highp float;
//]

// Ported from the user-provided Shadertoy-style box town shader.
uniform float t;

in vec2 v;

out vec4 outColor;

const float BPM = 140.0;

// Ref: https://www.shadertoy.com/view/XlXcW4
vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

vec2 gridCenter;

float gridTraversal(vec2 ro, vec2 rd) {
  gridCenter = floor(ro + rd * 1E-3) + 0.5;

  vec2 rdt = sign(rd) * max(abs(rd), 0.01);
  vec2 bv = -(ro - gridCenter) / rdt + abs(0.5 / rdt);
  return min(bv.x, bv.y);
}

float easeOutSharp(float x, float k) {
  return 1.0 - pow(1.0 - x, k);
}

float map(vec3 p) {
  float beat = t * BPM / 60.0;

  p.xz -= gridCenter;
  float offset = mix(
    hash3f(vec3(gridCenter, floor(beat))).x,
    hash3f(vec3(gridCenter, floor(beat) + 1.0)).x,
    easeOutSharp(fract(beat), 4.0)
  ) * 7.0 - 3.0;
  float d = min(
    sdbox(p + vec3(0.0, offset, 0.0), vec3(0.3, 4.0, 0.3)),
    sdbox(p + vec3(0.0, offset - 14.0, 0.0), vec3(0.3, 4.0, 0.3))
  );
  return d - 0.01;
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx) - map(p - d.yxx),
    map(p + d.xyx) - map(p - d.xyx),
    map(p + d.xxy) - map(p - d.xxy)
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 7.0, 10.0 + t * 4.0);
  vec3 rd = normalize(vec3(p * r2d(-t), 1.0));
  float rl = 0.0;
  float dist;

  for (int i = 0; i < 100; i++) {
    float limitD = gridTraversal(ro.xz, rd.xz);
    dist = map(ro);
    rl += min(limitD, dist);
    ro += rd * min(limitD, dist);
  }

  outColor = vec4(0, 0, 0, 1);
  if (dist < 0.01) {
    vec3 i_n = nMap(ro);
    outColor = vec4(exp(-0.2 * rl) * vec3(dot(i_n, -rd)), 1.0);
  }
}
