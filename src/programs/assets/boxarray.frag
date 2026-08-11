#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;
uniform sampler2D f;

out vec4 outColor;

const float PI = acos(-1.0);
const float BPS = 140.0 / 60.0;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

vec4 map(vec3 p) {
  float d = sdbox(p, vec3(1.0));
  return vec4(d, 0, 0, 0);
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

  vec2 cell = floor(p * 3.0);
  vec2 pt = fract(p * 3.0) - 0.5;

  vec3 ro = vec3(4.0 * pt, 7.0);
  vec3 rd = vec3(0.0, 0.0, -1.0);

  ro.yz *= r2d(0.2 * cell.x);
  rd.yz *= r2d(0.2 * cell.x);

  ro.zx *= r2d(0.2 * cell.y);
  rd.zx *= r2d(0.2 * cell.y);

  ro.xy *= r2d(t);
  rd.xy *= r2d(t);

  vec4 isect;

  for (int i = 0; i < 64; i++) {
    isect = map(ro);
    ro += rd * isect.x;
  }

  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (isect.x < 0.01) {
    vec3 N = nMap(ro);
    const vec3 L = normalize(vec3(1, 3, 2));

    N.xy *= r2d(-t);
    N.zx *= r2d(-0.2 * cell.y);
    N.yz *= r2d(-0.2 * cell.x);

    float i_d = max(dot(N, L), 0.0);
    float i_s = pow(max(dot(N, normalize(L - rd)), 0.0), 15.0);
    outColor = vec4(pow(i_d * vec3(0.9, 0.8, 0.02) + i_s, vec3(0.4545)), 1.0);
  }
}
