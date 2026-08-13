#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D g;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);

void main() {
  vec2 p = v;

  float n = 6.0;
  float a = atan(p.y, p.x) + t * 0.2;
  a = abs(mod(a, 2.0 * PI / n) - PI / n);
  float r = length(p);
  vec2 fp = r * vec2(cos(a), sin(a));

  vec2 uv = fp * 0.5 + 0.5;
  float mask = texture(g, uv).x;

  vec3 col = mask * (0.5 + 0.5 * cos(6.0 * r + vec3(0, 2, 4)));

  outColor = vec4(col, 1.0);
}
