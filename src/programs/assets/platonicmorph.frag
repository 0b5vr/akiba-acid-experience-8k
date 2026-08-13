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

float sdTetrahedron(vec3 p) {
  float d = 0.0;
  d = max(d, (p.x + p.y + p.z - 1.0) / 1.732);
  d = max(d, (-p.x - p.y + p.z - 1.0) / 1.732);
  d = max(d, (p.x - p.y - p.z - 1.0) / 1.732);
  d = max(d, (-p.x + p.y - p.z - 1.0) / 1.732);
  return d;
}

float sdIcosahedronApprox(vec3 p) {
  const vec3 n1 = vec3(0.0, 0.5257, 0.8507);
  const vec3 n2 = vec3(0.8507, 0.0, 0.5257);
  const vec3 n3 = vec3(0.5257, 0.8507, 0.0);
  vec3 ap = abs(p);
  float d = -1e9;
  d = max(d, dot(ap, n1));
  d = max(d, dot(ap, n2));
  d = max(d, dot(ap, n3));
  return d - 0.76;
}

float map(vec3 p) {
  p.xy *= r2d(t * 0.5);
  p.yz *= r2d(t * 0.3);
  float morphPhase = 0.5 + 0.5 * sin(t * 0.6);
  return mix(sdTetrahedron(p), sdIcosahedronApprox(p), morphPhase);
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.002);
  return normalize(vec3(
    map(p + d.yxx) - map(p - d.yxx),
    map(p + d.xyx) - map(p - d.xyx),
    map(p + d.xxy) - map(p - d.xxy)
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.8));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 60; i++) {
    dist = map(ro + rd * rl);
    rl += dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 n = nMap(ro + rd * rl);
    const vec3 L = normalize(vec3(0.5, 1.0, 0.4));
    float diff = max(dot(n, L), 0.0);
    col = vec3(0.1) + diff * vec3(0.9, 0.7, 0.2);
  }

  outColor = vec4(col, 1.0);
}
