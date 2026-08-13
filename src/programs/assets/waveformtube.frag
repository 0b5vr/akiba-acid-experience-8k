#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

float waveR(float theta, float z) {
  return 1.0 + 0.25 * sin(theta * 5.0 + z * 2.0 - t * 4.0) * sin(theta * 3.0 - z * 1.5 + t * 2.0);
}

float map(vec3 p) {
  float theta = atan(p.y, p.x);
  float r = waveR(theta, p.z);
  return r - length(p.xy);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0 * t);
  vec3 rd = normalize(vec3(p, -1.3));

  float rl = 0.0;
  float dist = 0.0;

  for (int i = 0; i < 70; i++) {
    dist = map(ro + rd * rl);
    rl += 0.5 * dist;
  }

  vec3 col = vec3(0.0);
  if (dist < 0.01) {
    vec3 rp = ro + rd * rl;
    float glow = 0.5 + 0.5 * sin(rp.z * 3.0 - t * 5.0);
    col = mix(vec3(0.1, 0.2, 1.0), vec3(0.8, 0.3, 1.0), glow) * exp(-0.05 * rl);
  }

  outColor = vec4(col, 1.0);
}
