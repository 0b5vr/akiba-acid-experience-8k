#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float TAU = 2.0 * acos(-1.0);
const float BPM = 140.0;

float beat, beatTau, beatPhase;

float phase(float x) {
  return floor(x) + 0.5 + 0.5 * cos(TAU * 0.5 * exp(-5.0 * fract(x)));
}

void union(inout vec4 hit, float distance, float material, float intensity, float hue) {
  if (distance < hit.x) {
    hit = vec4(distance, material, intensity, hue);
  }
}

float sdBox(vec3 p, vec3 size) {
  vec3 q = abs(p) - size;
  return length(max(q, 0.0)) + min(0.0, max(q.x, max(q.y, q.z)));
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

vec4 map(vec3 pos) {
  float a = 2.5;
  vec3 p = mod(pos, a) - a * 0.5;
  const vec3 offset = vec3(0.3, -0.07, 0);
  p -= offset;

  for (int i = 0; i < 1 + (int(beat) / 4) % 4; i++) {
    p = abs(p + offset) - offset;
    p.xz *= r2d(TAU * 0.8);
    p.zy *= r2d(mod(beatPhase + pos.z * 0.05, TAU) - TAU * 0.5);
  }

  vec4 hit = vec4(1.0);
  union(hit, sdBox(p, vec3(1.0, 0.1, 0.1)), 1.0, 1.0, 10.0);
  union(hit, sdBox(p, vec3(0.04, 0.1, 0.11)), 0.0, clamp(sin(beatTau), 0.0, 1.0), 0.4);
  union(hit, sdBox(p, vec3(1.0, 0.11, 0.01)), 0.0, clamp(sin(beatTau + TAU * pos.z / 16.0), 0.0, 1.0), 0.0);
  return hit;
}

vec3 normal(vec3 p) {
  const vec2 e = vec2(0.01, 0.0);
  return normalize(vec3(
    map(p + e.xyy).x - map(p - e.xyy).x,
    map(p + e.yxy).x - map(p - e.yxy).x,
    map(p + e.yyx).x - map(p - e.yyx).x
  ));
}

vec3 palette(float hue) {
  vec3 color = 0.5 + 0.5 * cos(TAU * (vec3(0.0, 0.33, 0.66) + hue));
  return mix(color, vec3(1.0), 0.1 * floor(hue));
}

vec3 render(vec3 ro, vec3 rd) {
  vec3 color = vec3(0.0);
  float rayLength = 0.0;

  for (int i = 0; i < 200; i++) {
    vec3 p = ro + rd * rayLength;
    vec4 hit = map(p);

    if (hit.y == 1.0) {
      rayLength += hit.x;
      if (hit.x < 0.001) {
        vec3 light = normalize(vec3(1.0, 1.0, -1.0));
        vec3 n = normal(p);
        float diffuse = clamp(dot(n, light), 0.0, 1.0);
        float specular = pow(clamp(dot(n, normalize(light - rd)), 0.0, 1.0), 10.0);
        color += 0.1 * diffuse + specular;
        break;
      }
    } else {
      rayLength += 0.5 * abs(hit.x) + 0.01;
      color += clamp(0.001 * palette(hit.w) * hit.z / abs(hit.x), 0.0, 1.0);
    }
  }

  return color * exp(-0.01 * rayLength);
}

void main() {
  beat = t * BPM / 60.0;
  beatTau = beat * TAU;
  beatPhase = phase(beat);

  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, beat * 8.0);
  vec3 rd = normalize(vec3(p, 16.0));
  outColor = vec4(render(ro, rd), 1.0);
}
