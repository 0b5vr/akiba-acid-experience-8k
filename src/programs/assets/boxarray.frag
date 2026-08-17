#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;
uniform sampler2D f;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = 2.0 * PI;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

vec3 applyLogQuat(vec3 p, vec3 lq) {
  float theta = length(lq);
  if (theta < 1e-6) {
    return p;
  }

  vec3 qv = lq * sin(theta) / theta; // axis * sin(t)
  float i_c = cos(theta);

  // ryg's quaternion vector multiplication
  vec3 t = 2.0 * cross(qv, p);
  return p + i_c * t + cross(qv, t);
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

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

vec4 map(vec3 p) {
  vec2 cell = floor(p.xy);
  p.xy -= cell + 0.5;

  vec3 i_lq = 5.0 * cyclic(vec3(0.1 * cell, t), 0.5, 1.1);
  p = applyLogQuat(p, i_lq);

  float d = sdbox(p, vec3(0.3));
  return vec4(d, 0, 0, 0);
}

vec3 nMap(vec3 p) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx).x - map(p - d.yxx).x,
    map(p + d.xyx).x - map(p - d.xyx).x,
    map(p + d.xxy).x - map(p - d.xxy).x
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(3.0 * p, 5.0);
  vec3 rd = vec3(0.0, 0.0, -1.0);

  vec4 isect;

  for (int i = 0; i < 64; i++) {
    isect = map(ro);
    ro += rd * isect.x;
  }

  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (isect.x < 0.01) {
    vec3 N = nMap(ro);
    const vec3 L = normalize(vec3(1, 2, 3));

    float i_d = max(dot(N, L), 0.0);
    float i_s = pow(max(dot(N, normalize(L - rd)), 0.0), 15.0);
    outColor = vec4(pow(i_d * vec3(0.8, 0.9, 1.0) + i_s, vec3(0.4545)), 1.0);
  }
}
