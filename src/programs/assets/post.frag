#version 300 es

//[
precision highp float;
//]

// #pragma shader_minifier_plugin bypass

uniform float t;
uniform sampler2D f;
uniform sampler2D b;

// TODO: optimize these uniform names later
uniform float zoom;
uniform float shake;
uniform float tile;
uniform float kaleidoscope;
uniform float codercolor;
uniform float posterize;
uniform float chougouyoku;
uniform float white;
uniform float feedback;

in vec2 v;

out vec4 outColor;

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

mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,s,-s,c);}

vec3 calctint(float t) {
  return 3.0 * smoothstep(1.0, 0.0, abs(3.0 * t - vec3(1.0, 1.5, 2.0)));
}

void main() {
  vec2 p = v;

  // tile
  p = mod((p + 1.0) * tile, 2.0) - 1.0;

  p.x *= 16.0 / 9.0;

  // chougouyoku - zoom
  p *= 1.0 - 0.1 * mod(floor(t * 30.0), 2.0) * chougouyoku;

  // kaleidoscope
  if (kaleidoscope > 0.0) {
    float a = atan(p.y, p.x);
    a = abs(mod(a / PI + 1.0 / kaleidoscope, 2.0 / kaleidoscope) - 1.0 / kaleidoscope) * PI;
    p = length(p) * vec2(cos(a), sin(a));
  }

  // accumulation
  float dither = hash3f(vec3(p, t)).x;

  vec3 sum = vec3(0.0);
  for (int i = 0; i < SAMPLES; i++) {
    float phase = (float(i) + dither) / SAMPLES_F;

    vec2 pt = p * (1.0 - zoom * phase);

    vec2 uvt = pt;
    uvt.x *= 9.0 / 16.0;
    uvt = uvt * 0.5 + 0.5;

    uvt.y += 0.1 * shake * sin(TAU * phase * 3.0 + t);

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
  sum = mix(sum, i_codercolor, codercolor);

  // posterize
  luma = dot(sum, LUMA);
  vec3 i_posterized = smoothstep(0.2, 0.1, luma) * vec3(0.8, 1.0, 0.04) + smoothstep(0.6, 0.7, luma);
  sum = mix(sum, i_posterized, posterize);

  // chougouyoku - neg
  sum = mix(sum, 1.0 - sum, mod(floor(t * 15.0), 2.0) * chougouyoku);

  // ビデオフィードバックンゴ
  if (feedback > 0.0) {
    const mat3 ycc2rgb = mat3(1.0,1.0,1.0,0.0,-0.344,1.773,1.403,-0.714,0.0);
    const mat3 rgb2ycc = mat3(0.299,-0.168936,0.499413,0.587,-0.330468,-0.418931,0.114,0.499704,-0.081282);
    const float ASPECT = 16.0 / 9.0;
    vec2 su=v;su.x*=ASPECT;
    vec3 back=vec3(0),ycc=vec3(0);
    for(int i=0;i<16;i++)
    {
      vec3 y=rgb2ycc*texture(b,(su/vec2(ASPECT, 1.0)+1.)*.5).rgb/16.;
      y.yz*=rot(y.z*TAU+cos(v.x)*TAU)*1.1;
      su+=(y.yz*8.-su)*0.004;
      ycc+=y;
    }
    back=(ycc2rgb*ycc);
    sum = mix(sum,back*1.0, exp(-1.0 / (30.0 * feedback)));
  }

  // white
  sum = mix(sum, vec3(1.0), white);

  outColor = vec4(sum, 1.0);
}
