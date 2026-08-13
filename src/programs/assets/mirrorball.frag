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

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float map(vec3 p) {
  p.xy *= r2d(t);
  return sdSphere(p, 1.0);
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx) - map(p - d.yxx),
    map(p + d.xyx) - map(p - d.xyx),
    map(p + d.xxy) - map(p - d.xxy)
  ));
}

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.5));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 60; i++) {
    dist = map(ro + rd * rl);
    rl += dist;
  }

  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (dist < 0.01) {
    vec3 rp = ro + rd * rl;
    vec3 n = nMap(rp);

    // ファセット量子化 -- ミラーボールのパネル感
    vec3 fn = normalize(floor(n * 8.0) / 8.0 + 0.001);
    vec3 r = reflect(rd, fn);

    // 反射方向とパネルごとの位相でスパークルさせる
    float sparkle = pow(0.5 + 0.5 * sin(30.0 * hash(floor(n * 8.0)) + 10.0 * r.x + 8.0 * t), 20.0);

    vec3 col = vec3(0.15) + sparkle * vec3(1.0, 0.9, 1.0);
    outColor = vec4(col, 1.0);
  }
}
