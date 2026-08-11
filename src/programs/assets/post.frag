#version 300 es

//[
precision highp float;
//]

// #pragma shader_minifier_plugin bypass

const int SAMPLES = 20;
const float SAMPLES_F = float(SAMPLES);

const float PI = acos(-1.0);
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

in vec2 v;

uniform float t;
uniform sampler2D f;

uniform float zoom;
uniform float tile;
uniform float kaleidoscope;
uniform float codercolor;

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
  p = mod((p + 1.0) * tile, 2.0) - 1.0;
  p.x *= 16.0 / 9.0;

  if (kaleidoscope > 0.0) {
    float a = atan(p.y, p.x);
    a = abs(mod(a / PI + 1.0 / kaleidoscope, 2.0 / kaleidoscope) - 1.0 / kaleidoscope) * PI;
    p = length(p) * vec2(cos(a), sin(a));
  }

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

  // vignette
  sum *= 1.0 - 0.2 * dot(p, p);

  // codercolor
  float luma = dot(sum, LUMA);
  sum = mix(sum, 0.5 + 0.5 * cos(12.0 * luma + vec3(0, 2, 4) + 5.0 * t), codercolor);

  outColor = vec4(sum, 1.0);
}
