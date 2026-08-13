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

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;
  p *= r2d(0.3);

  float beamY = smoothstep(0.03, 0.0, abs(p.y)) * step(p.x, -0.3);

  float spreadX = p.x + 0.3;
  float band = p.y - spreadX * 0.6;
  vec3 rainbow = 0.5 + 0.5 * cos(6.28 * (band * 3.0 + vec3(0.0, 0.33, 0.67)) + 1.5);
  float mask = smoothstep(-0.4, 0.4, spreadX) * step(-0.3, p.x) * step(abs(p.y), 0.5);

  vec3 col = beamY * vec3(1.0) + mask * rainbow;

  outColor = vec4(col, 1.0);
}
