#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 sun = vec2(0.0, 0.6);
  vec2 toP = p - sun;
  float theta = atan(toP.y, toP.x);
  float r = length(toP);

  // 角度ごとに遮蔽物っぽいノイズを与えて光条の濃淡を作る
  float raySeed = floor(theta * 40.0);
  float rayNoise = hash(raySeed);
  float ray = smoothstep(0.35, 1.0, rayNoise);

  float falloff = exp(-1.2 * r);
  float shaft = ray * falloff;

  // 塵によるゆらぎ
  shaft *= 0.7 + 0.3 * sin(20.0 * r - 3.0 * t + raySeed);

  vec3 col = shaft * vec3(1.0, 0.95, 0.75);
  col += falloff * 0.15 * vec3(1.0, 0.9, 0.6);

  outColor = vec4(col, 1.0);
}
