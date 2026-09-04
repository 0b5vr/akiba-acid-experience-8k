#version 300 es

//[
precision highp float;
//]

const int MAX_ITER = 300;

uniform float t;

in vec2 v;

out vec4 outColor;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec2 c = vec2(0.343, 0.4);
  p *= r2d(-t);
  vec2 z = p * 0.1 + vec2(0.1015, 0.5018);

  float sn = float(MAX_ITER) - 1.0;

  for (int i = 0; i < MAX_ITER; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c; // z = z^2 + c

    float z2 = dot(z, z);
    if (z2 > 65536.0) {
      // ref: https://iquilezles.org/articles/msetsmooth/
      sn = float(i) - log2(log2(dot(z, z))) + 4.0;
      break;
    }
  }

  vec3 col = sqrt(0.5 + 0.5 * cos(sn - 40.0 * t - vec3(0, 2, 3.5))) * exp(-0.01 * sn + 0.5);

  outColor = vec4(col, 1.0);
}
