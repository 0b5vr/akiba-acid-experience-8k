#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float sdcylinder(vec3 p, float r, float h) {
  vec2 d = vec2(length(p.xy) - r, length(p.z) - h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec2 map(vec3 p) {
  p.zx *= r2d(7.0 * t);
  p.x = abs(p.x);

  // body
  vec2 d = vec2(sdcylinder(p, 0.2, 0.0) - 0.2, 1.0);

  // legs
  vec2 d2 = vec2(length(p - vec3(0.4, -0.2, 0.0)) - 0.1, 1.0);
  if (d2.x < d.x) {
    d = d2;
  }
  d2 = vec2(length(p - vec3(0.3, -0.34, 0.0)) - 0.1, 1.0);
  if (d2.x < d.x) {
    d = d2;
  }

  // eyes
  d2 = vec2(length(p - vec3(0.15, 0.3, 0.15)) - 0.08, 0.0);
  if (d2.x < d.x) {
    d = d2;
  }

  // claws
  vec3 pt = p - vec3(0.4, 0.2, 0.0);
  pt.xy *= r2d(-0.9);
  d2 = vec2(
    max(
      sdcylinder(pt, 0.15, 0.0) - 0.07,
      0.5 * pt.y - abs(pt.x) - 0.03
    ),
    1.0
  );
  if (d2.x < d.x) {
    d = d2;
  }

  return d;
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

  vec3 ro = vec3(0.0, 0.0, 1.5);
  vec3 rd = normalize(vec3(p, -2.0));
  float rl = 0.0;
  vec2 dist;

  for (int i = 0; i < 100; i++) {
    dist = map(ro + rd * rl);
    rl += dist.x;
  }

  outColor = vec4(0.0, 0.0, 0.0, 0.0);
  if (abs(dist.x) < 0.01) {
    vec3 n = nMap(ro + rd * rl);
    vec3 l = normalize(vec3(2.0, 1.0, 1.0));
    vec3 h = normalize(l - rd);

    vec3 i_baseColor = dist.y < 0.5 ? vec3(0.1) : vec3(0.8, 0.4, 0.6);
    vec3 i_d = i_baseColor * (0.5 + vec3(0.5, 0.4, 0.3) * dot(n, l));
    vec3 i_s = vec3(1.0) * pow(max(dot(n, h), 0.0), 20.0);

    outColor = vec4(i_d + i_s, 1.0);
  }
}
