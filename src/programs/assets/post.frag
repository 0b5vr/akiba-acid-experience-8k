#version 300 es

//[
precision highp float;
//]

// #pragma shader_minifier_plugin bypass

const int SAMPLES = 20;
const float SAMPLES_F = float(SAMPLES);

in vec2 v;

uniform float t;
uniform sampler2D f;

uniform float zoom;

out vec4 outColor;

uvec3 hash3u(uvec3 v) {
  v = v * 1664525u + 1013904223u;

  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;

  v ^= v >> 16u;

  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;

  return v;
}

vec3 hash3f(vec3 v) {
  uvec3 r = floatBitsToUint(v);
  return vec3(hash3u(r)) / float(-1u);
}

vec3 calctint(float t) {
  return 3.0 * smoothstep(1.0, 0.0, abs(3.0 * t - vec3(1.0, 1.5, 2.0)));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float dither = hash3f(vec3(p, t)).x;

  vec3 sum = vec3(0.0);
  for (int i = 0; i < SAMPLES; i++) {
    float phase = (float(i) + dither) / SAMPLES_F;

    vec2 pt = p * (1.0 - zoom * phase);

    vec2 uvt = pt;
    uvt.x *= 9.0 / 16.0;
    uvt = uvt * 0.5 + 0.5;

    vec3 tex = texture(f, uvt).xyz;

    vec3 tint = calctint(phase);
    sum += tint * tex;
  }

  sum /= SAMPLES_F;

  sum *= 1.0 - 0.5 * dot(v, v);

  outColor = vec4(sum, 1.0);
}
