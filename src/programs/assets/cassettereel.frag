#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float TAU = acos(-1.0) * 2.0;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float d = 1e9;
  vec2 centers[2];
  centers[0] = vec2(-0.4, 0.0);
  centers[1] = vec2(0.4, 0.0);

  for (int c = 0; c < 2; c++) {
    vec2 center = centers[c];
    float spin = c == 0 ? 2.0 : -2.0;
    vec2 lp = (p - center) * r2d(t * spin);

    float outer = abs(length(lp) - 0.25) - 0.01;
    d = min(d, outer);

    for (int i = 0; i < 6; i++) {
      float a = float(i) / 6.0 * TAU;
      d = min(d, sdSegment(lp, vec2(0.0), 0.22 * vec2(cos(a), sin(a))) - 0.005);
    }

    d = min(d, length(lp) - 0.05);
  }

  float line = smoothstep(0.005, 0.0, d);
  vec3 col = line * vec3(0.6, 0.5, 0.4);

  outColor = vec4(col, 1.0);
}
