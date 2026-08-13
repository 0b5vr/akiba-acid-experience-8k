#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float TAU = acos(-1.0) * 2.0;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 4.0 * t);
  vec3 rd = normalize(vec3(p, -1.3));
  rd.xy *= r2d(0.1 * t);

  // 円柱内壁(半径1)との解析的交差
  vec2 o = ro.xy;
  vec2 d = rd.xy;
  float a = dot(d, d);
  float b = dot(o, d);
  float c = dot(o, o) - 1.0;
  float h = b * b - a * c;

  vec3 col = vec3(0.0);
  if (h > 0.0) {
    float dist = (-b + sqrt(h)) / a; // 内壁との交点(奥側)
    vec3 rp = ro + rd * dist;

    float theta = atan(rp.y, rp.x);
    float ringLine = abs(fract(rp.z * 0.8) - 0.5);
    float barLine = abs(fract(theta * 6.0 / TAU) - 0.5);

    float cage = 1.0 - smoothstep(0.0, 0.06, min(ringLine, barLine));
    col = cage * vec3(0.2, 1.0, 0.5) * exp(-0.05 * dist);
  }

  outColor = vec4(col, 1.0);
}
