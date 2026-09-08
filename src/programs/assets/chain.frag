#version 300 es

//[
precision highp float;
//]

// Ported from the user-provided Shadertoy-style chain shader.
uniform float t;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);

float sd_chain(vec3 p, float le, float r1, float r2) {
  vec3 q = vec3(p.x, max(abs(p.y) - le, 0.0), p.z);
  return length(vec2(length(q.xy) - r1, q.z)) - r2;
}

vec3 rotate(vec3 p, vec3 axis, float theta) {
  float cosTheta = cos(theta);
  float sinTheta = sin(theta);
  return p * cosTheta + cross(axis, p) * sinTheta + axis * dot(axis, p) * (1.0 - cosTheta);
}

float map(vec3 p) {
  p = rotate(p, vec3(1.0, 0.0, 0.0), PI * 0.5);
  p = rotate(p, vec3(0.0, 1.0, 0.0), p.y * 0.1);
  p -= vec3(1.0, 0.0, 2.0);

  p.xz = mod(p.xz, 2.0) - 1.0;
  vec3 p1 = p;
  p1.y = mod(p1.y, 1.5) - 0.75;
  float d1 = sd_chain(p1, 0.3, 0.2, 0.05);

  vec3 p2 = p;
  p2.y += 0.75;
  p2 = rotate(p2, vec3(0.0, 1.0, 0.0), PI / 2.0);
  p2.y = mod(p2.y, 1.5) - 0.75;
  float d2 = sd_chain(p2, 0.3, 0.2, 0.05);

  return min(d1, d2);
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(1.0, -1.0) * 0.001;
  return normalize(vec3(
    map(p + e.xyy) - map(p + e.yyy),
    map(p + e.yxy) - map(p + e.yyy),
    map(p + e.yyx) - map(p + e.yyy)
  ));
}

void main() {
  vec2 uv = v;
  uv.x *= 16.0 / 9.0;
  vec3 col = vec3(0.0);

  vec3 ro = vec3(0.0, 0.0, -1.0 + t * 10.0);
  vec3 rd = normalize(vec3(uv, 1.0));

  vec3 p = ro;
  for (int i = 0; i < 100; i++) {
    float d = map(p);
    if (d < 0.001) {
      vec3 n = getNormal(p);
      vec3 light = normalize(ro + vec3(0.0, 0.0, 100.0) - p);
      vec3 h = normalize(light - rd);
      // abs preserves the even power while avoiding pow's undefined negative base.
      col = vec3(1.0 - float(i) / 100.0) * pow(abs(dot(h, n)), 10.0) * 5.0;
      break;
    }
    p += rd * d;
  }

  outColor = vec4(col, 1.0);
}
