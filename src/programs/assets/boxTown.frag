#version 300 es

//[
precision highp float;
precision highp int;
//]

// Ported from the user-provided Shadertoy-style box town shader.
uniform float t;

in vec2 v;

out vec4 outColor;

const uint C_HASH = 2309480282U;

vec3 hash33(vec3 p) {
  uvec3 x = floatBitsToUint(p);
  x = C_HASH * ((x >> 8U) ^ x.yzx);
  x = C_HASH * ((x >> 8U) ^ x.yzx);
  x = C_HASH * ((x >> 8U) ^ x.yzx);
  return vec3(x) * (1.0 / float(0xffffffffU));
}

float hash13(vec3 p) {
  return hash33(p).x;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

vec3 rotate(vec3 p, vec3 axis, float a) {
  float c = cos(a);
  float s = sin(a);
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
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

float easeOut(float x, float n) {
  return 1.0 - pow(1.0 - x, n);
}

float map(vec3 p) {
  p.xz -= gridCenter;
  float offset = mix(
    hash13(vec3(gridCenter, floor(t))),
    hash13(vec3(gridCenter, floor(t) + 1.0)),
    easeOut(fract(t), 10.0)
  ) * 7.0 - 3.0;
  float d = min(
    sdBox(p + vec3(0.0, offset, 0.0), vec3(0.3, 4.0, 0.3)),
    sdBox(p + vec3(0.0, offset - 14.0, 0.0), vec3(0.3, 4.0, 0.3))
  );
  return d - 0.01;
}

vec3 getNormal(vec3 p) {
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
  rd = rotate(rd, vec3(0.0, 0.0, 1.0), t);

  vec3 pos = ro;
  for (int i = 0; i < 100; i++) {
    float limitD = gridTraversal(pos.xz, rd.xz);
    float d = map(pos);
    if (d < 0.001) {
      vec3 normal = getNormal(pos);
      vec3 light = normalize(ro - pos);
      col = vec3(1.0 - float(i) / 100.0) * dot(normal, light);
      break;
    }
    d = min(limitD, d);
    pos += rd * d;
  }

  outColor = vec4(col, 1.0);
}
