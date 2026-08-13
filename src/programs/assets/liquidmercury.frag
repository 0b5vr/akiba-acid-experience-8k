#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
  float d = 1e9;

  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec3 c = 0.6 * vec3(sin(t * 0.6 + fi * 2.1), cos(t * 0.5 + fi * 1.7), sin(t * 0.4 + fi * 3.3));
    d = smin(d, length(p - c) - 0.35, 0.4);
  }

  return d;
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

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.6));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 70; i++) {
    dist = map(ro + rd * rl);
    rl += dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 rp = ro + rd * rl;
    vec3 n = nMap(rp);
    vec3 r = reflect(rd, n);
    float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    float spec = pow(max(dot(r, normalize(vec3(0.5, 1.0, 0.3))), 0.0), 20.0);
    col = vec3(0.15) + fresnel * vec3(0.6) + spec * vec3(1.0);
  }

  outColor = vec4(col, 1.0);
}
