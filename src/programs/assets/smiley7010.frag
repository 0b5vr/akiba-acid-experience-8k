#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

float sdsmiley(vec2 p) {
  p.x = abs(p.x);

  float i_dmouse = abs(length(p) - 0.55);
  float theta = atan(p.x, -p.y);
  float i_width = mix(0.15, 0.05, smoothstep(0.0, 1.6, theta)) * cos(clamp(30.0 * (theta - 1.4), -1.3, 3.1));
  float d = min(i_dmouse - i_width, abs(length(p) - 0.8) - 0.02);

  p -= vec2(0.2, 0.3);
  p.y *= 0.3;
  d = min(d, length(p) - 0.08);

  return d;
}

float sdbox(vec2 p, vec2 s) {
  vec2 d = abs(p) - s;
  return length(max(d, 0.0)) + min(0.0, max(d.x, d.y));
}

// src: https://iquilezles.org/articles/distfunctions2d/
float sdtriangle(in vec2 p, in float r) {
  const float SQRT3 = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / SQRT3;
  if (p.x + SQRT3 * p.y > 0.0) {
    p = vec2(p.x - SQRT3 * p.y, -SQRT3 * p.x - p.y) / 2.0;
  }
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  vec2 p = v;
  p.x = p.x * 16.0 / 9.0;

  int i = int(t * 20.0) % 7;

  if (i == 0) {
    // 7010 point
    float dshape = sdsmiley(p * 2.0) / 2.0;
    p = abs(p);
    dshape = min(
      dshape,
      min(
        max(
          abs(p.x - p.y) - 0.04,
          abs(p.x + p.y - 0.85) - 0.15
        ),
        max(
          abs(min(p.x, p.y) - 0.35) - 0.024,
          abs(p.x - p.y) - 0.15
        )
      )
    );

    float i_shape = clamp(-dshape * 540.0, 0.0, 1.0);
    float i_mask = step(max(p.x, p.y), 0.6);
    outColor = i_mask * mix(vec4(0.1, 0.5, 0.33, 1.0), vec4(1.0), i_shape);
  } else if (i == 1) {
    // 7010 mandatory
    float i_d = sdsmiley(p * 1.5) / 1.5;

    float i_shape = clamp(-i_d * 540.0, 0.0, 1.0);
    float i_mask = clamp(-(length(p) - 0.7) * 540.0, 0.0, 1.0);
    outColor = i_mask * mix(vec4(0.0, 0.33, 0.55, 1.0), vec4(1.0), i_shape);
  } else if (i == 2) {
    // 7010 warning
    float dtri = sdtriangle(p + vec2(0, 0.1), 0.7) - 0.03;
    float i_dshape = min(
      sdsmiley(p * 2.5 + vec2(0, 0.25)) / 2.5,
      -0.08 - dtri
    );

    float i_shape = clamp(-i_dshape * 540.0, 0.0, 1.0);
    float i_mask = clamp(-dtri * 540.0, 0.0, 1.0);
    outColor = i_mask * mix(vec4(1, 0.66, 0, 1), vec4(0, 0, 0, 1), i_shape);
  } else if (i == 3) {
    // 7010 prohibition
    float i_dshape = sdsmiley(p * 1.6) / 1.6;

    float i_dred = min(
      0.6 - length(p),
      abs(p.x + p.y) - 0.07
    );

    float i_shape = clamp(-i_dshape * 540.0, 0.0, 1.0);
    float i_mask = clamp(-(length(p) - 0.7) * 540.0, 0.0, 1.0);
    float i_shapered = clamp(-i_dred * 540.0, 0.0, 1.0);
    outColor = i_mask * mix(
      mix(vec4(1), vec4(0, 0, 0, 1), i_shape),
      vec4(0.7, 0.1, 0.2, 1.0),
      i_shapered
    );
  } else if (i == 4) {
    // japan indication
    float drect = sdbox(p, vec2(0.55, 0.55));

    float i_dshape = min(
      sdsmiley(p * 1.8) / 1.8,
      abs(drect - 0.03) - 0.01
    );
    float i_dmask = drect - 0.05;

    float i_shape = clamp(-i_dshape * 540.0, 0.0, 1.0);
    float i_mask = clamp(-i_dmask * 540.0, 0.0, 1.0);
    outColor = i_mask * mix(vec4(0.0, 0.4, 0.7, 1.0), vec4(1.0), i_shape);
  } else if (i == 5) {
    // japan regulatory
    float dshape = sdsmiley(p * 1.8) / 1.8;

    float i_dred = max(
      0.52 - length(p),
      0.01 - abs(0.68 - length(p))
    );

    float i_shape = clamp(-dshape * 540.0, 0.0, 1.0);
    float i_mask = clamp(-(length(p) - 0.7) * 540.0, 0.0, 1.0);
    float i_shapered = clamp(-i_dred * 540.0, 0.0, 1.0);
    outColor = i_mask * mix(
      mix(vec4(1), vec4(0.0, 0.4, 0.7, 1.0), i_shape),
      vec4(0.9, 0.1, 0.14, 1.0),
      i_shapered
    );
  } else if (i == 6) {
    // japan warning
    float dsmiley = sdsmiley(p * 2.0) / 2.0;
    const float SQRT2 = sqrt(2.0);
    p *= mat2(1, 1, -1, 1) / SQRT2;
    float drect = sdbox(p, vec2(0.5, 0.5));
    float drect2 = sdbox(p, vec2(0.44, 0.44));

    float i_dshape = min(
      dsmiley,
      max(drect - 0.03, 0.06 - drect2)
    );
    float i_dmask = drect - 0.05;

    float i_shape = clamp(-i_dshape * 540.0, 0.0, 1.0);
    float i_mask = clamp(-i_dmask * 540.0, 0.0, 1.0);
    outColor = i_mask * mix(vec4(1.0, 0.88, 0.0, 1.0), vec4(0, 0, 0, 1), i_shape);
  }
}
