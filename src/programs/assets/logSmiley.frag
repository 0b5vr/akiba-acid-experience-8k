#version 300 es

precision highp float;

uniform float t;
in vec2 v;
out vec4 outColor;

const float PI = acos(-1.0);
const float TRANSLATION = 0.72;
const float TWIST = 2.1;
const float PITCH = TWIST / TRANSLATION;
const float SMILEY_STEP = TRANSLATION * 0.52;
const float BRIDGE_STEP = SMILEY_STEP / 3.0;
const float RAIL_OFFSET = 1.85;
const float SMILEY_SCALE = 0.6378649;
const float SMILEY_PHASE = 0.5015318;

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

void main() {
  vec2 p = v * vec2(16.0 / 9.0, 1.0);
  // zoom and rotate in log-polar coordinates
  float zoom = 0.55 * t;
  // to logarithmic coordinates
  float radiusLog = log(max(length(p), 1e-6)) - TRANSLATION * zoom;
  float angle = atan(p.y, p.x) + TWIST * zoom;
  float phase = angle + PITCH * radiusLog;
  float phaseGap = abs(mod(phase + PI, 2.0 * PI) - PI);

  float railDistance = abs(phaseGap - RAIL_OFFSET);
  float railPixels = railDistance / fwidth(railDistance);
  float railCore = 1.0 - smoothstep(0.75, 1.65, railPixels);
  float brightness = mix(0.4 * exp(-0.34 * railPixels), 1.0, railCore);

  // Periodic crossbars follow the direction across the two spiral rails.
  float bridgePhase = mod(phase, 2.0 * PI) - PI;
  float bridgeCoordinate = radiusLog - PITCH / (1.0 + PITCH * PITCH) * bridgePhase;
  float bridgeDistance = abs(mod(bridgeCoordinate + 0.5 * BRIDGE_STEP, BRIDGE_STEP) - 0.5 * BRIDGE_STEP);
  float bridge = (1.0 - smoothstep(0.85, 2.0, bridgeDistance / fwidth(bridgeDistance)))
    * step(RAIL_OFFSET, phaseGap);
  brightness = mix(brightness, 1.0, bridge);

  // mod
  float localRadius = mod(radiusLog + 0.5 * SMILEY_STEP, SMILEY_STEP) - 0.5 * SMILEY_STEP;
  float smiley = 0.0;
  for (int i = -2; i <= 1; i++) {
    float r = localRadius + float(i) * SMILEY_STEP;
    float localAngle = phase - PITCH * r - SMILEY_PHASE;

    // to cartesian coordinates
    vec2 i_pp = exp(r) * vec2(cos(localAngle), sin(localAngle));
    vec2 p = (i_pp - vec2(1, 0)) / SMILEY_SCALE;

    float d = sdsmiley(p);
    smiley = max(smiley, step(d, 0.0));
  }

  vec3 railColor = 0.5 + 0.5 * cos(vec3(0, 2, 4) - 0.6 * t - radiusLog);
  outColor = vec4(mix(railColor * brightness, vec3(1, 1, 0), smiley), 1);
}
