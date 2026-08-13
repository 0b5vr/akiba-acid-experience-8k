#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

// 4次元回転(xw平面, yz平面)
vec4 rotateXW(vec4 p, float a) {
  float c = cos(a), s = sin(a);
  return vec4(p.x * c - p.w * s, p.y, p.z, p.x * s + p.w * c);
}

vec4 rotateYZ(vec4 p, float a) {
  float c = cos(a), s = sin(a);
  return vec4(p.x, p.y * c - p.z * s, p.y * s + p.z * c, p.w);
}

vec4 tesseractVertex(int i) {
  return vec4(
    (i & 1) == 0 ? -1.0 : 1.0,
    (i & 2) == 0 ? -1.0 : 1.0,
    (i & 4) == 0 ? -1.0 : 1.0,
    (i & 8) == 0 ? -1.0 : 1.0
  );
}

vec2 project(vec4 p) {
  float d = 3.0 / (3.0 - p.w); // 4次元から3次元への透視投影
  vec3 p3 = p.xyz * d;
  float d2 = 2.5 / (2.5 - p3.z); // 3次元から2次元への透視投影
  return p3.xy * d2;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float minDist = 1e9;

  for (int i = 0; i < 16; i++) {
    vec4 a4 = tesseractVertex(i);
    a4 = rotateXW(a4, t * 0.5);
    a4 = rotateYZ(a4, t * 0.3);
    vec2 pa = project(a4);

    for (int j = 0; j < 4; j++) {
      int bit = 1 << j;
      if ((i & bit) != 0) { continue; }

      vec4 b4 = tesseractVertex(i | bit);
      b4 = rotateXW(b4, t * 0.5);
      b4 = rotateYZ(b4, t * 0.3);
      vec2 pb = project(b4);

      minDist = min(minDist, sdSegment(p, pa, pb));
    }
  }

  float line = smoothstep(0.015, 0.0, minDist);
  outColor = vec4(vec3(line) * vec3(0.6, 0.9, 1.0), 1.0);
}
