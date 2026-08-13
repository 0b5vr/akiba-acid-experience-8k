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

  float zoom = exp(mod(t * 0.3, 8.0));
  vec2 center = vec2(-0.745, 0.1);
  vec2 c = center + p / zoom;

  vec2 z = vec2(0.0);
  float iter = 0.0;
  const int MAX = 80;

  for (int i = 0; i < MAX; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 4.0) { break; }
    iter += 1.0;
  }

  float f = iter / float(MAX);
  vec3 col = step(f, 0.995) * (0.5 + 0.5 * cos(6.28 * f * 3.0 + vec3(0, 2, 4)));

  outColor = vec4(col, 1.0);
}
