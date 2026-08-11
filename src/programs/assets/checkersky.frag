#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D f;

in vec2 v;

out vec4 outColor;

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 rd = normalize(vec3(p, -1.0));

  float rl = 1.0 / abs(rd.y);
  vec3 rp = rd * rl;
  rp.z -= 5.0 * t;

  if (rd.y > 0.0) {
    float i_noise = 0.5 + 0.5 * texture(f, vec2(0.2, 0.05) * rp.xz).x;
    outColor = vec4(mix(vec3(0, 0, 1), vec3(1), i_noise), 1.0);
  } else {
    float i_checker = step(0.0, sin(3.0 * rp.x) * sin(3.0 * rp.z));
    outColor = vec4(vec3(i_checker), 1.0);
  }

  outColor.rgb += vec3(0.01, 0.02, 0.03) * rl;
}
