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

float map(vec3 p) {
  p.xy *= r2d(t * 0.4);
  p.yz *= r2d(t * 0.3);

  float base = length(p) - 0.7;
  float n = 6.0;
  float theta = atan(length(p.xy), p.z);
  float phi = atan(p.y, p.x);
  float spike = 0.4 * pow(abs(cos(n * phi) * sin(theta * 3.0)), 3.0);

  return base - spike;
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

  for (int i = 0; i < 70; i++) {
    dist = map(ro + rd * rl);
    rl += 0.7 * dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.015) {
    vec3 n = nMap(ro + rd * rl);
    const vec3 L = normalize(vec3(0.5, 1.0, 0.4));
    float diff = max(dot(n, L), 0.0);
    col = vec3(0.1) + diff * vec3(1.0, 0.3, 0.5);
  }

  outColor = vec4(col, 1.0);
}
