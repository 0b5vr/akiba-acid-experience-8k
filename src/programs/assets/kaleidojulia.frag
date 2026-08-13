#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float n = 5.0;
  float a = atan(p.y, p.x);
  a = abs(mod(a, 2.0 * PI / n) - PI / n);
  float r = length(p) * 1.2;
  vec2 z = r * vec2(cos(a), sin(a));
  vec2 c = 0.7885 * vec2(cos(t * 0.3), sin(t * 0.3));

  float iter = 0.0;
  const int MAX = 48;

  for (int i = 0; i < MAX; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 4.0) { break; }
    iter += 1.0;
  }

  float f = iter / float(MAX);
  vec3 col = 0.5 + 0.5 * cos(6.28 * f + vec3(0, 2, 4));
  col *= step(f, 0.99);

  outColor = vec4(col, 1.0);
}
