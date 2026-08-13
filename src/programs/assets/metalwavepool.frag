#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float BPS = 140.0 / 60.0;
const float PI = acos(-1.0);

float heightMap(vec2 p) {
  float h = 0.0;
  h += 0.5 * sin(3.0 * p.x + t * 2.0);
  h += 0.3 * sin(4.0 * p.y - t * 2.5);
  h += 0.2 * sin(6.0 * length(p) - t * BPS * PI);
  return h * 0.06;
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 eps = vec2(0.01, 0.0);
  float hC = heightMap(p);
  float hX = heightMap(p + eps.xy);
  float hY = heightMap(p + eps.yx);

  vec3 n = normalize(vec3(-(hX - hC) / eps.x, -(hY - hC) / eps.x, 1.0));
  vec3 L = normalize(vec3(0.4, 0.6, 0.8));

  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0, 0, 1)), 0.0), 30.0);

  vec3 col = vec3(0.2) + diff * vec3(0.5) + spec * vec3(1.0);

  outColor = vec4(col, 1.0);
}
