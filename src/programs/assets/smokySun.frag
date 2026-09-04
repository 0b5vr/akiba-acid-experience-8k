#version 300 es

//[
precision highp float;
//]

uniform float t;
uniform sampler2D f;

in vec2 v;

out vec4 outColor;

const float ASPECT = 16.0 / 9.0;
const float BPS = 140.0 / 60.0;
const float NOISE_SCALE = 0.1;

float fbm(vec2 p) {
  return 0.5 + 0.5 * texture(f, p).x;
}

float smokeDensity(vec2 uv) {
  vec2 p = uv - 0.5;
  p.x *= ASPECT;

  float height = uv.y;

  vec2 flow = NOISE_SCALE * p * vec2(2.3, 1.7);
  flow.y -= NOISE_SCALE * t * 2.0 * 0.16;

  vec2 warp = vec2(
    fbm(
      flow * 0.55
      + NOISE_SCALE * vec2(0.025 * t, 0.0)
    ),
    fbm(
      flow * 0.55
      + NOISE_SCALE * vec2(5.2, 1.3 + 0.02 * t)
    )
  ) - 0.5;

  vec2 warped = flow + 2.6 * NOISE_SCALE * warp;

  float body = fbm(warped);
  float detail = fbm(
    2.0 * warped + NOISE_SCALE * vec2(7.3, 3.8)
  );

  float noise = body - 0.12 * (1.0 - detail);

  float width = mix(0.06, 0.48, pow(height, 0.7));
  width *= mix(0.8, 1.2, warp.y + 0.5);

  float plumeX = p.x + 0.48 * warp.x;
  float edge = 1.0 - smoothstep(
    0.3 * width,
    width,
    abs(plumeX)
  );

  float density = smoothstep(0.20, 0.56, noise) * edge;
  density = 1.0 - exp(-1.6 * density);
  density *= mix(1.0, 0.7, height);

  return density;
}

float sdCircle(vec2 p, vec3 circle) {
  return distance(p, circle.xy) - circle.z;
}

float sunHalo(
  vec2 p,
  float radius,
  float haloWidth,
  float rays
) {
  float r = length(p);
  float a = atan(p.y, p.x);
  float radialDistance = r - radius;
  float radialPhase = max(radialDistance / haloWidth, 0.0);

  vec2 noiseUv =
    vec2(0.5)
    + 0.6 * p
    + vec2(0.002, -0.003) * t;
  float noise = fbm(noiseUv);
  float phase = rays * a + 4.0 * (noise - 0.5);

  vec2 rootUv =
    vec2(0.5)
    + 0.6 * radius * normalize(p)
    + vec2(0.002, -0.003) * t;
  float rayLength = mix(
    0.55,
    1.2,
    fbm(rootUv + vec2(0.37, 0.19))
  );
  float rayProgress = clamp(radialPhase / rayLength, 0.0, 1.0);
  float ray = pow(
    0.5 + 0.5 * cos(phase),
    mix(6.0, 48.0, rayProgress)
  );

  float outer = 1.0 - smoothstep(
    rayLength - 0.18,
    rayLength,
    radialPhase
  );

  return ray * outer;
}

vec3 sunColor(vec2 uv) {
  vec2 p = uv - 0.5;
  p.x *= ASPECT;

  float pulseRadius = 0.1 + 0.2 * exp(-8.0 * mod(t, 1.0 / BPS));
  if (sdCircle(p, vec3(0.0, 0.0, pulseRadius)) < 0.0) {
    return vec3(0.55, 0.0, 0.02);
  }

  if (sdCircle(p, vec3(0.0, 0.0, 0.3)) < 0.0) {
    return vec3(0.0);
  }

  mat2 rotation = mat2(cos(t), sin(t), -sin(t), cos(t));
  float halo = sunHalo(
    p * rotation,
    0.3,
    0.5,
    24.0
  );
  vec3 bgColor = vec3(0.9215, 0.54117, 0.1294);
  return mix(bgColor, vec3(0), smoothstep(0.0, 0.1, halo));
}

// -- main ----------------------------------------------------------------------------------------
void main() {
  vec2 uv = 0.5 + 0.5 * v;
  float density = smokeDensity(uv);

  outColor = vec4(mix(sunColor(uv), vec3(1.0), density), 1.0);
}
