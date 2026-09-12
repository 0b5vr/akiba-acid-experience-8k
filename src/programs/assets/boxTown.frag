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

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

vec2 gridCenter;

float gridTraversal(vec2 ro, vec2 rd) {
  gridCenter = floor(ro + rd * 1E-3) + 0.5;

  // A ray parallel to a grid axis never crosses a boundary on that axis.
  // Avoid division by zero for those rays (including the screen center).
  vec2 bv = vec2(1E20);
  if (rd.x != 0.0) {
    bv.x = -(ro.x - gridCenter.x) / rd.x + abs(0.5 / rd.x);
  }
  if (rd.y != 0.0) {
    bv.y = -(ro.y - gridCenter.y) / rd.y + abs(0.5 / rd.y);
  }
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
  vec2 d = vec2(0.0, 1E-4);
  return normalize(vec3(
    map(p + d.yxx) - map(p - d.yxx),
    map(p + d.xyx) - map(p - d.xyx),
    map(p + d.xxy) - map(p - d.xxy)
  ));
}

void main() {
  vec2 uv = v;
  uv.x *= 16.0 / 9.0;
  vec3 col = vec3(0.0);

  vec3 ro = vec3(0.0, 7.0, 10.0 + t * 10.0);
  vec3 rd = normalize(vec3(uv, 1.0));
  rd.xy *= r2d(-t);

  vec3 pos = ro;
  for (int i = 0; i < 100; i++) {
    float limitD = gridTraversal(pos.xz, rd.xz);
    float d = map(pos);
    if (d < 0.001) {
      vec3 normal = nMap(pos);
      vec3 light = normalize(ro - pos);
      col = vec3(1.0 - float(i) / 100.0) * dot(normal, light);
      break;
    }
    d = min(limitD, d);
    pos += rd * d;
  }

  outColor = vec4(col, 1.0);
}
