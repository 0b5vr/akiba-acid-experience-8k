#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D f;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);
const float INV_BPS = 0.42;
const float ROWS = 3.0;
const float TEXTW = 2.0; // width of the text cell, in row-height units

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

float sdsmiley(vec2 p) {
  p.x = abs(p.x);

  float i_dmouse = abs(length(p) - 0.55);
  float theta = atan(p.x, -p.y);
  float i_width = mix(0.15, 0.05, smoothstep(0.0, 1.6, theta)) * cos(clamp(30.0 * (theta - 1.4), -1.3, 3.1));
  float d = i_dmouse - i_width;

  p -= vec2(0.2, 0.3);
  p.y *= 0.3;
  d = min(d, length(p) - 0.08);

  return d;
}

void main() {
  float b = t / INV_BPS;

  vec2 p = v;
  p.x *= 16.0 / 9.0;

  // rows
  float y = (p.y + 1.0) * 0.5 * ROWS;
  float row = floor(y);
  float ly = fract(y);
  float dir = mod(row, 2.0) * 2.0 - 1.0;

  // cells
  // cell: [text][smiley]
  const float PERIOD = TEXTW + 1.0;
  float x = p.x * ROWS * 0.5 + dir * b * 0.6 + mod(row, 2.0) * 0.5 * PERIOD;
  float lx = mod(x, PERIOD);

  // 0: fill, 1: outline, alternating per cell
  float mode = mod(floor(x / PERIOD), 2.0);

  float shape;

  if (lx < TEXTW) {
    // text
    vec2 uv = vec2(0.1 + 0.8 * lx / TEXTW, 0.5 + 0.82 * (ly - 0.5));
    const vec2 e = vec2(0.003, 0.005);

    float c = texture(f, uv).x;
    float i_edge = max(
      max(abs(c - texture(f, uv + e.xy * vec2(1, 0)).x), abs(c - texture(f, uv - e.xy * vec2(1, 0)).x)),
      max(abs(c - texture(f, uv + e.xy * vec2(0, 1)).x), abs(c - texture(f, uv - e.xy * vec2(0, 1)).x))
    );

    shape = mix(c, i_edge, mode);
  } else {
    // smiley
    vec2 q = 2.0 * vec2(lx - TEXTW - 0.5, ly - 0.5);
    q *= 0.9 * r2d(dir * b * PI / 4.0);

    float i_disc = length(q) - 0.8;
    float i_face = sdsmiley(q);

    // fill: solid disc with the face cut out / outline: ring + face strokes
    float d = mix(
      max(i_disc, -i_face),
      min(abs(i_disc) - 0.03, i_face),
      mode
    );

    shape = clamp(-d * 180.0, 0.0, 1.0);
  }

  outColor = shape * vec4(1.0);
}
