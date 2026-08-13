#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float TAU = acos(-1.0) * 2.0;
const float BPS = 140.0 / 60.0;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  // ビートの4分割タイミングだけ回転角をサンプルすることでストロボ効果を作る
  float strobeTime = floor(t * BPS * 4.0) / (BPS * 4.0);
  float angle = strobeTime * 5.3;

  float theta = atan(p.y, p.x) - angle;
  float r = length(p);

  const float SPOKES = 12.0;
  float spoke = smoothstep(0.06, 0.0, abs(fract(theta / TAU * SPOKES) - 0.5) - 0.4);

  float rim = smoothstep(0.02, 0.0, abs(r - 0.75));
  float hub = smoothstep(0.08, 0.07, r);

  float shape = max(max(spoke * step(r, 0.75), rim), hub);

  outColor = vec4(vec3(shape), 1.0);
}
