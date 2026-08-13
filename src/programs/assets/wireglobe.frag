#version 300 es

//[
precision highp float;
//]

in vec2 v;

uniform float t;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = PI * 2.0;

mat2 r2d(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -1.6));

  // 単位球との解析的交差
  float b = dot(ro, rd);
  float c = dot(ro, ro) - 1.0;
  float h = b * b - c;

  vec3 col = vec3(0.0);
  if (h > 0.0) {
    h = sqrt(h);
    float dist = -b - h;
    vec3 rp = ro + rd * dist;

    vec3 n = normalize(rp);
    n.xy *= r2d(t);
    n.xz *= r2d(0.3 * t);

    float lat = asin(clamp(n.y, -1.0, 1.0));
    float lon = atan(n.z, n.x);

    float latLine = abs(fract(lat / PI * 12.0 + 0.5) - 0.5);
    float lonLine = abs(fract(lon / TAU * 24.0 + 0.5) - 0.5);

    float line = min(latLine, lonLine);
    float grid = smoothstep(0.06, 0.0, line);

    // 経線をなぞるように光が走査する
    float sweep = smoothstep(0.03, 0.0, abs(fract(lon / TAU - 0.2 * t) - 0.5));

    vec3 base = vec3(0.15, 0.5, 1.0) * grid;
    vec3 sweepCol = vec3(1.0, 0.9, 0.3) * sweep * grid;

    col = base + sweepCol;
  }

  outColor = vec4(col, 1.0);
}
