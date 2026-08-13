#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;
const float PI = acos(-1.0);

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

vec4 map(vec3 p) {
  float d = sdSphere(p, 1.0);
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

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 cell = floor(p * 3.0);
  vec2 pt = fract(p * 3.0) - 0.5;

  float bounce = abs(sin(t * BPS * PI + hash(cell) * 6.28));
  vec3 ro = vec3(4.0 * pt, 6.0);
  vec3 rd = vec3(0.0, 0.0, -1.0);
  ro.y -= 1.5 * bounce;

  vec4 isect = vec4(0.0);
  for (int i = 0; i < 48; i++) {
    isect = map(ro);
    ro += rd * isect.x;
  }

  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (isect.x < 0.01) {
    vec3 N = nMap(ro);
    const vec3 L = normalize(vec3(1, 3, 2));
    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, normalize(L - rd)), 0.0), 20.0);
    outColor = vec4(pow(diff * vec3(0.7, 0.75, 0.8) + spec, vec3(0.4545)), 1.0);
  }
}
