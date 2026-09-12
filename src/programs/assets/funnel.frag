#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);
const float BPS = 140.0 / 60.0;
const float A = 5.0;
const float T = 0.07;
const float RMAX = 10.0;

vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

float sdsmiley(vec2 p) {
  p.x = abs(p.x);

  float i_dmouse = abs(length(p) - 0.55);
  float theta = atan(p.x, -p.y);
  float i_width = mix(0.15, 0.05, smoothstep(0.0, 1.6, theta)) * cos(clamp(30.0 * (theta - 1.4), -1.3, 3.1));
  float d = i_dmouse - i_width;

  p -= vec2(0.2, 0.3);
  p.y *= 0.3;
  d = min(d, length(p) - 0.08);

  return d;
}

vec3 noise3(float x) {
  vec3 n = vec3(0.0);
  for(int i = 0; i < 2; i++) {
    n += (mix(
      hash3f(vec3(floor(x), 3.0, float(i))),
      hash3f(vec3(floor(x) + 1.0, 3.0, float(i))),
      smoothstep(0.0, 1.0, fract(x))
    ) - 0.5) / float(1 + i);
    x *= 2.0;
  }
  return n;
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float slope(float r) {
  return A / (r * r) + T;
}

float map(vec3 p) {
  float r = max(length(p.xz), 0.1);
  return (p.y + A / r - T * r) / (1.0 + slope(r));
}

void main() {
  float b = t * BPS;

  vec3 ro = vec3(0.0, 1.8, 3.6) + vec3(1.6, 0.2, 1.2) * noise3(0.1 * b);
  vec3 m = noise3(0.125 * b);
  vec3 rd = normalize(vec3(v.x * 16.0 / 9.0, v.y, -1.5));
  rd.xy *= r2d(0.12 * m.x);
  rd.yz *= r2d(0.81 + 0.18 * m.y);
  rd.xz *= r2d(0.15 * m.z);

  float rl = 0.0;
  vec3 rp;
  float dist;

  for(int i = 0; i < 150; i++) {
    rp = ro + rd * rl;
    dist = map(rp);
    if(dist < 0.001)
      break;
    rl += dist;
  }

  float col = 0.0;

  if(dist < 0.001) {
    float r = length(rp.xz);

    vec2 g = vec2(4.0 * rp.y - 1.2 * b, 12.0 * atan(rp.z, rp.x) / PI);
    vec2 w = min(fwidth(g), 0.1);
    float px = max(6.0 / rl, 1.0);
    vec2 i_lines = smoothstep((px + 0.5) * w, (px - 0.5) * w, 0.5 - abs(fract(g) - 0.5));

    float i_cell = step(hash3f(vec3(floor(g), floor(4.0 * b))).x, 0.06);

    float i_rare = step(hash3f(vec3(floor(g), floor(b))).y, 0.005);
    vec2 q = 2.0 * (fract(g).yx - 0.5) * r2d(PI * b);
    float i_smiley = clamp(-max(length(q) - 0.8, -sdsmiley(q)) / (2.0 * max(w.x, w.y)), 0.0, 1.0);

    float i_facing = smoothstep(0.0, 0.2, abs(dot(normalize(vec3(-slope(r) * rp.xz / r, 1.0).xzy), rd)));
    float i_fade = smoothstep(-8.5, -2.0, rp.y) * smoothstep(RMAX, 0.5 * RMAX, r);

    col = max(max(i_lines.x, i_lines.y), mix(i_cell, i_smiley, i_rare)) * i_facing * i_fade;
  }

  outColor = vec4(vec3(col), 1.0);
}
