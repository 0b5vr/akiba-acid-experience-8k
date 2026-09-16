#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float TAU = 2.0 * acos(-1.0);
const float BPM = 140.0;

float beatPhase;

float easeOutSharp(float x, float k) {
  return 1.0 - pow(1.0 - x, k);
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float sdbox(vec3 p, vec3 size) {
  vec3 q = abs(p) - size;
  return length(max(q, 0.0)) + min(0.0, max(q.x, max(q.y, q.z)));
}

vec2 map(vec3 pos) {
  float a = 2.0;
  vec3 p = mod(pos, a) - a * 0.5;
  const vec3 offset = vec3(0.3, -0.07, 0);
  p -= offset;

  for (int i = 0; i < 3; i++) {
  // for (int i = 0; i < 1 + (int(beat) / 4) % 4; i++) {
    p = abs(p + offset) - offset;
    p.xz *= r2d(TAU * 0.8);
    p.zy *= r2d(mod(beatPhase + pos.z * 0.1, TAU * 0.8) - TAU * 0.4);
  }

  // base
  vec2 hit = vec2(sdbox(p, vec3(1.0, 0.1, 0.1)), 0.0); // dist, material

  // blue
  vec2 hit2 = vec2(sdbox(p, vec3(0.04, 0.1, 0.11)), 1.0);
  if (hit2.x < hit.x) {
    hit = hit2;
  }

  // red
  hit2 = vec2(sdbox(p, vec3(1.0, 0.11, 0.01)), 2.0);
  if (hit2.x < hit.x) {
    hit = hit2;
  }

  return hit;
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
  float beat = t * BPM / 60.0;
  float beatTau = beat * TAU;
  beatPhase = floor(beat) + easeOutSharp(fract(beat), 4.0);

  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, beat);
  vec3 rd = normalize(vec3(p, 1.0));

  vec3 color = vec3(0.0);
  float rayLength = 0.0;

  for (int i = 0; i < 100; i++) {
    vec3 rp = ro + rd * rayLength;
    vec2 hit = map(rp);

    if (hit.y == 0.0) {
      rayLength += hit.x;
      if (hit.x < 0.001) {
        vec3 light = normalize(vec3(1.0, 1.0, -1.0));
        vec3 n = nMap(rp);
        float diffuse = clamp(dot(n, light), 0.0, 1.0);
        float specular = pow(clamp(dot(n, normalize(light - rd)), 0.0, 1.0), 10.0);
        color += 0.1 * diffuse + specular;
        break;
      }
    } else {
      // phantom mode!
      rayLength += 0.5 * abs(hit.x) + 0.01;
      vec3 emissive = hit.y == 2.0
        ? vec3(1.0, 0.2, 0.2) * clamp(sin(beatTau + TAU * rp.z / 16.0), 0.0, 1.0)
        : vec3(0.1, 0.4, 1.0);
      color += clamp(0.001 * emissive / abs(hit.x), 0.0, 1.0);
    }
  }

  outColor = vec4(color * exp(-0.1 * rayLength), 1.0);
}
