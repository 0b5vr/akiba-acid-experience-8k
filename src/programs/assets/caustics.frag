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

float causticLayer(vec2 p, float scale, float speed) {
  p *= scale;
  p += vec2(sin(p.y + t * speed), cos(p.x - t * speed)) * 0.5;
  return abs(sin(p.x) + cos(p.y));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float c1 = causticLayer(p, 3.0, 1.0);
  float c2 = causticLayer(p * r2d(1.0), 3.5, -1.3);
  float caustic = pow(1.0 - min(c1, c2) * 0.5, 8.0);

  vec3 col = caustic * vec3(0.3, 0.7, 1.0) + vec3(0.0, 0.1, 0.2);

  outColor = vec4(col, 1.0);
}
