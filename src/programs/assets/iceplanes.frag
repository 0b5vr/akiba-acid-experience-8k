#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D f;

in vec2 v;

out vec4 outColor;

// Ref: https://www.shadertoy.com/view/XlXcW4
vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

// Shoutouts to AND
void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 rd = normalize(vec3(p, -1.0));

  vec4 sum = vec4(0);
  for (int i = 0; i < 9; i++) {
    float rl = (0.4 + 0.4 + 0.4 * sin(t) + 0.4 * float(i)) / abs(rd.x);
    vec3 rp = rd * rl;

    const float DENSITY_Y = 10.0;

    float cell = floor(rp.y * DENSITY_Y);
    float speed = 1.0 - exp(2.0 * hash3f(vec3(cell, i, 3)).x);
    rp.z += speed * t;

    float i_alpha = 0.1;
    float i_shapey = smoothstep(0.3, 0.25, abs(rp.y * DENSITY_Y - cell - 0.5));
    float i_shapez = smoothstep(0.3, 0.25, abs(fract(rp.z * 0.3) - 0.5));
    float i_fog = smoothstep(10.0, 5.0, rl);
    sum += i_alpha * vec4(1.0, 3.0, 5.0, 1.0) * (1.0 - sum.w) * i_shapey * i_shapez * i_fog;
  }

  outColor = vec4(sum.xyz, 1.0);
}
