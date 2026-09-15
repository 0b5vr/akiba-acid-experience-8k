#version 300 es

//[
precision highp float;
//]

// #pragma shader_minifier_plugin bypass

uniform float t;
uniform sampler2D f;
uniform sampler2D b;

uniform float p0; // zoom
uniform float p1; // shake
uniform float p2; // tile
uniform float p3; // kaleidoscope
uniform float p4; // codercolor
uniform float p5; // posterize
uniform float p6; // white
uniform float p7; // feedback
uniform float p8; // flowInvert

in vec2 v;

out vec4 outColor;

const float BPM = 140.0;
const int SAMPLES = 20;
const float SAMPLES_F = float(SAMPLES);

const float PI = acos(-1.0);
const float TAU = 2.0 * PI;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

// Ref: https://www.shadertoy.com/view/XlXcW4
vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

vec3 calctint(float t) {
  return 3.0 * smoothstep(1.0, 0.0, abs(3.0 * t - vec3(1.0, 1.5, 2.0)));
}

// Same cyclic noise as noiseaura.frag.
mat3 orthbas(vec3 z) {
  z = normalize(z);
  vec3 up = abs(z.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  vec3 x = normalize(cross(up, z));
  return mat3(x, cross(z, x), z);
}

vec3 cyclic(vec3 p, float pers, float lacu) {
  vec4 sum = vec4(0);
  mat3 rot = orthbas(vec3(2, -3, 1));

  for (int i = 0; i < 5; i++) {
    p *= rot;
    p += sin(p.zxy);
    sum += vec4(cross(cos(p), sin(p.yzx)), 1);
    sum /= pers;
    p *= lacu;
  }

  return sum.xyz / sum.w;
}

void main() {
  vec2 p = v;

  // tile
  p = mod((p + 1.0) * p2, 2.0) - 1.0;

  p.x *= 16.0 / 9.0;

  // kaleidoscope
  if (p3 > 0.0) {
    float a = atan(p.y, p.x);
    a = abs(mod(a / PI + 1.0 / p3, 2.0 / p3) - 1.0 / p3) * PI;
    p = length(p) * vec2(cos(a), sin(a));
  }

  // accumulation
  float dither = hash3f(vec3(p, t)).x;

  vec3 sum = vec3(0.0);
  for (int i = 0; i < SAMPLES; i++) {
    float phase = (float(i) + dither) / SAMPLES_F;

    vec2 pt = p * (1.0 - p0 * phase);

    vec2 uvt = pt;
    uvt.x *= 9.0 / 16.0;
    uvt = uvt * 0.5 + 0.5;

    uvt.y += 0.1 * p1 * sin(TAU * phase * 3.0 + t);

    vec3 tex = texture(f, uvt).xyz;

    vec3 tint = calctint(phase);
    sum += tint * tex;
  }

  sum /= SAMPLES_F;

  // vignette
  // sum *= 1.0 - 0.2 * dot(p, p);

  // codercolor
  float luma = dot(sum, LUMA);
  vec3 i_codercolor = 0.5 + 0.5 * cos(12.0 * luma + vec3(0, 2, 4) + 5.0 * t);
  sum = mix(sum, i_codercolor, p4);

  // posterize
  luma = dot(sum, LUMA);
  vec3 i_posterized = smoothstep(0.2, 0.1, luma) * vec3(0.8, 1.0, 0.04) + smoothstep(0.6, 0.7, luma);
  sum = mix(sum, i_posterized, p5);

  // ビデオフィードバックンゴ
  if (p7 > 0.0) {
    const mat3 ycc2rgb = mat3(1.0,1.0,1.0,0.0,-0.344,1.773,1.403,-0.714,0.0);
    const mat3 rgb2ycc = mat3(0.299,-0.168936,0.499413,0.587,-0.330468,-0.418931,0.114,0.499704,-0.081282);
    const float ASPECT = 16.0 / 9.0;
    vec2 su=v;su.x*=ASPECT;
    vec3 back=vec3(0),ycc=vec3(0);
    for(int i=0;i<16;i++)
    {
      vec3 y=rgb2ycc*texture(b,(su/vec2(ASPECT, 1.0)+1.)*.5).rgb/16.;
      y.yz*=r2d(y.z*TAU+cos(v.x)*TAU)*1.1;
      su+=(y.yz*8.-su)*0.004;
      ycc+=y;
    }
    back=(ycc2rgb*ycc);
    sum = mix(sum,back*1.0, exp(-1.0 / (30.0 * p7)));
  } 

  if (p8 > 0.0) {
    float beat = t * BPM / 60.0;
    vec2 texUv = v * 0.5 + 0.5;
    vec2 dxy = 1.0 / vec2(textureSize(b, 0));
    vec2 offset = (floor(cyclic(vec3(fract(texUv * 3.0), beat), 1.0, 1.0).xy)) * dxy;
    vec2 flowUv = clamp(texUv + offset, 0.5 * dxy, 1.0 - 0.5 * dxy);
    vec3 flowColor = texture(b, flowUv).rgb;
    vec3 color;
    if (length(flowColor) > 0.5) {
      color = flowColor;
    } else {
      color = sum * 10.0;
    }
    color *= 0.8;
    sum = mix(sum, color, p8);
  }

  // white
  sum = mix(sum, vec3(1.0), p6);


  outColor = vec4(sum, 1.0);
}
