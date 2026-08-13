#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float r = length(p);
  float a = atan(p.y, p.x);

  float warpedR = 1.0 / (r + 0.15); // 中心への吸い込み
  float spiral = a + warpedR * 2.0 - t * 3.0;

  float rings = 0.5 + 0.5 * sin(warpedR * 6.0 - t * 8.0);
  float spokes = 0.5 + 0.5 * sin(spiral * 8.0);

  float pattern = rings * spokes;
  vec3 col = pattern * mix(vec3(0.1, 0.2, 1.0), vec3(1.0, 0.2, 0.8), 0.5 + 0.5 * sin(warpedR - t));
  col *= smoothstep(0.02, 0.3, r); // 中心の特異点を隠す

  outColor = vec4(col, 1.0);
}
