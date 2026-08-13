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

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 2.5);
  vec3 rd = normalize(vec3(p, -1.7));
  rd.xz *= r2d(t * 0.3);

  float b = dot(ro, rd);
  float c = dot(ro, ro) - 1.0;
  float h = b * b - c;

  vec3 col = vec3(0.0);
  if (h > 0.0) {
    h = sqrt(h);
    float dist = -b - h;
    vec3 rp = ro + rd * dist;
    vec3 n = normalize(rp);

    // 方向ベクトルを量子化した疑似ボロノイセルでパンチアウト
    vec3 qn = floor(n * 4.0);
    float punch = step(0.4, hash(qn));

    float diff = max(dot(n, normalize(vec3(0.5, 1.0, 0.3))), 0.0);
    col = punch * (vec3(0.1) + diff * vec3(0.9, 0.5, 0.2));
  }

  outColor = vec4(col, 1.0);
}
