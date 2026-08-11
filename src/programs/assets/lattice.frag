#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;
uniform sampler2D f;

out vec4 outColor;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

float map(vec3 p) {
  p.xy *= r2d(0.2 * p.z + 0.2 * t);
  p.z -= fract(2.0 * t);
  p = fract(p) - 0.5;
  p = abs(p);
  p.xy = p.x > p.y ? p.xy : p.yx;
  p.xz = p.x > p.z ? p.xz : p.zx;
  return sdbox(p, vec3(0.48, 0.02, 0.1));
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx) - map(p - d.yxx),
    map(p + d.xyx) - map(p - d.xyx),
    map(p + d.xxy) - map(p - d.xxy)
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 5.0);
  vec3 rd = normalize(vec3(p, -2.0));
  float rl = 0.0;
  float dist;

  for (int i = 0; i < 100; i++) {
    dist = map(ro + rd * rl);
    rl += dist;
  }

  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (dist < 0.01) {
    vec3 N = nMap(ro + rd * rl);

    float i_l = max(0.0, dot(N, vec3(1, -2, 3)));
    float i_fog = exp(-0.4 * rl);
    // vec3 i_color = 0.5 + 0.5 * cos(vec3(0, 2, 4) + 5.0 * t + rl);
    outColor = vec4(vec3(i_l * i_fog), 1.0);
  }
}
