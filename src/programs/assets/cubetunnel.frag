#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = PI * 2.0;

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
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

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float sdbox(vec3 p, vec3 s) {
  vec3 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(max(d.x, d.y), d.z));
}

float map(vec3 p, float zcell) {
  p.xy *= r2d(sin(t + zcell * TAU / 8.0));

  float theta = atan(p.y, p.x);
  float thetaCell = (floor(theta / TAU * 12.0) + 0.5) * TAU / 12.0;
  p.xy *= r2d(thetaCell);

  p.x -= 2.5;
  p.z -= zcell;

  p.yz *= r2d(t + thetaCell);
  p.xy *= r2d(t + zcell * TAU / 8.0);
  p.yz *= r2d(t - thetaCell);

  return sdbox(p, vec3(0.4));
}

vec3 nMap(vec3 p, float zcell) {
  const vec2 d = vec2(0.0, 0.001);
  return normalize(vec3(
    map(p + d.yxx, zcell) - map(p - d.yxx, zcell),
    map(p + d.xyx, zcell) - map(p - d.xyx, zcell),
    map(p + d.xxy, zcell) - map(p - d.xxy, zcell)
  ));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, -mod(4.0 * t, 8.0));
  vec3 rd = normalize(vec3(p, -2.0));
  float rl = 0.0;
  float dist;

  float zcell = floor(ro.z);

  for (int i = 0; i < 100; i++) {
    float rlCellEnd = (zcell - 0.5 - ro.z) / rd.z;
    dist = map(ro + rd * rl, zcell);
    rl += dist;

    if (rl >= rlCellEnd) {
      rl = rlCellEnd;
      zcell -= 1.0;
    }
  }

  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (dist < 0.01) {
    vec3 i_n = nMap(ro + rd * rl, zcell);
    vec3 r = reflect(rd, i_n);
    r.yz *= r2d(t);
    float i_fog = exp(-0.2 * rl);

    float i_rawnoise = cyclic(2.0 * r, 0.5, 2.0).x;
    float i_noise = 4.0 * pow(0.5 + 0.5 * i_rawnoise, 2.0);
    outColor = vec4(vec3(i_fog * i_noise), 1.0);
    // outColor = vec4(0.5 + 0.5 * i_n, 1.0);
  }
}
