#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

float sdcylinder(vec3 p, float r, float h) {
  vec2 d = vec2(length(p.xy), abs(p.z)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdtorus(vec3 p, float r1, float r2) {
  vec2 q = vec2(length(p.xy) - r1, p.z);
  return length(q) - r2;
}

float map(vec3 p) {
  p.yz *= r2d(1.0);
  p.zx *= r2d(1.0);

  float phase = mod(t * 140.0 / 60.0, 4.0);

  float d = length(p) - 1.0;
  float d0 = d;

  d = mix(d, sdtorus(p, 0.8, 0.4), smoothstep(0.0, 0.9, phase));
  d = mix(d, sdbox(p, vec3(0.8)), smoothstep(1.0, 1.9, phase));
  d = mix(d, sdcylinder(p, 0.6, 1.0), smoothstep(2.0, 2.9, phase));
  d = mix(d, d0, smoothstep(3.0, 3.9, phase));

  return d;
}

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

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx) - map(p - d.yxx),
    map(p + d.xyx) - map(p - d.xyx),
    map(p + d.xxy) - map(p - d.xxy)
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0);
  ro.zx *= r2d(1.5 * t);
  vec3 rd = normalize(vec3(p, -2.0));
  rd.zx *= r2d(1.5 * t);
  float dist;

  for (int i = 0; i < 100; i++) {
    dist = map(ro);
    ro += rd * dist;
  }

  outColor = vec4(0.0, 0.0, 0.0, 0.0);
  if (abs(dist) < 0.01) {
    float haha = 1.0 - exp(-4.0 * abs(cyclic(4.0 * ro, 0.5, 2.0)).x);
    vec3 i_baseColor = mix(
      vec3(0.2, 0.4, 0.7),
      vec3(1.0),
      haha
    );

    vec3 n = nMap(ro);
    vec3 l = normalize(vec3(1.0, 2.0, 1.0));
    vec3 i_h = normalize(l - rd);

    vec3 i_diffuse = i_baseColor * mix(vec3(0.0, 0.1, 0.2), vec3(1.0, 0.9, 0.8), 0.5 + 0.5 * dot(n, l));
    float i_specular = exp(-haha) * pow(max(dot(n, i_h), 0.0), exp(3.0 + haha));

    outColor = vec4(i_diffuse + i_specular, 1.0);
  }
}
