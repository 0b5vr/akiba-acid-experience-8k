#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float sdcylinder(vec3 p, float r, float h) {
  vec2 d = vec2(length(p.xy) - r, length(p.z) - h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec4 map(vec3 p) {
  p.xy *= r2d(0.2);
  p.zx *= r2d(4.0 * t);
  p.x = abs(p.x);

  // body
  return vec4(sdcylinder(p, 0.7, 0.0) - 0.2, p);
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx).x - map(p - d.yxx).x,
    map(p + d.xyx).x - map(p - d.xyx).x,
    map(p + d.xxy).x - map(p - d.xxy).x
  ));
}

float sdsmiley(vec2 p) {
  float i_dmouse = abs(length(p) - 0.55);
  float theta = atan(p.x, -p.y);
  float i_width = mix(0.15, 0.05, smoothstep(0.0, 1.6, theta)) * cos(clamp(30.0 * (theta - 1.4), -1.3, 1.6));
  float d = i_dmouse - i_width;

  p -= vec2(0.2, 0.3);
  p.y *= 0.3;
  d = min(d, length(p) - 0.08);

  return d;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 2.5);
  vec3 rd = normalize(vec3(p, -2.0));
  float rl = 0.0;
  vec4 dist;

  for (int i = 0; i < 100; i++) {
    dist = map(ro + rd * rl);
    rl += dist.x;
  }

  outColor = vec4(0.0, 0.0, 0.0, 0.0);
  if (abs(dist.x) < 0.01) {
    vec3 n = nMap(ro + rd * rl);
    vec3 l = normalize(vec3(2.0, 1.0, 1.0));
    vec3 h = normalize(l - rd);

    float mtl = step(0.0, sdsmiley(dist.yz));
    vec3 i_baseColor = mix(vec3(0.0), vec3(0.9, 0.8, 0.02), mtl);
    vec3 i_d = i_baseColor * (0.5 + vec3(0.5, 0.4, 0.3) * dot(n, l));
    vec3 i_s = vec3(1.0) * pow(max(dot(n, h), 0.0), mix(10.0, 40.0, mtl));

    outColor = vec4(i_d + i_s, 1.0);
  }
}
