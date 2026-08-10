#version 300 es

//[
precision highp float;
//]

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = 2.0 * PI;

// Ref: https://www.shadertoy.com/view/XlXcW4
vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

vec2 cis(float t) {
  return vec2(cos(t), sin(t));
}

vec3 perlin23(vec2 p, float m) {
  vec2 cell = floor(p);
  vec2 t = fract(p);
  vec2 ts = (t * t * t * (t * (t * 6.0 - 15.0) + 10.0));

  vec2 v;
  vec3 dice;
  vec3 sum = vec3(0);
  int i = 0;

  v = vec2(ivec2(i++) >> ivec2(0, 1) & 1);
  dice = TAU * hash3f(mod((cell + v).xxy, m));
  sum += mix(1.0 - ts, ts, v).x * mix(1.0 - ts, ts, v).y * (t - v).xxy * mat3(vec3(0, cis(dice.x)), vec3(0, cis(dice.y)), vec3(0, cis(dice.z)));
  v = vec2(ivec2(i++) >> ivec2(0, 1) & 1);
  dice = TAU * hash3f(mod((cell + v).xxy, m));
  sum += mix(1.0 - ts, ts, v).x * mix(1.0 - ts, ts, v).y * (t - v).xxy * mat3(vec3(0, cis(dice.x)), vec3(0, cis(dice.y)), vec3(0, cis(dice.z)));
  v = vec2(ivec2(i++) >> ivec2(0, 1) & 1);
  dice = TAU * hash3f(mod((cell + v).xxy, m));
  sum += mix(1.0 - ts, ts, v).x * mix(1.0 - ts, ts, v).y * (t - v).xxy * mat3(vec3(0, cis(dice.x)), vec3(0, cis(dice.y)), vec3(0, cis(dice.z)));
  v = vec2(ivec2(i++) >> ivec2(0, 1) & 1);
  dice = TAU * hash3f(mod((cell + v).xxy, m));
  sum += mix(1.0 - ts, ts, v).x * mix(1.0 - ts, ts, v).y * (t - v).xxy * mat3(vec3(0, cis(dice.x)), vec3(0, cis(dice.y)), vec3(0, cis(dice.z)));

  return sum * 8.0 / m;
}

void main() {
  vec2 p = 0.5 + 0.5 * v;

  vec3 sum = vec3(0);

  float m = 8.0;
  sum += perlin23(p * m, m);
  m *= 2.0;
  sum += perlin23(p * m, m);
  m *= 2.0;
  sum += perlin23(p * m, m);
  m *= 2.0;
  sum += perlin23(p * m, m);

  outColor = vec4(sum, 1.0);
}
