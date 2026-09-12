#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);
const float TAU = 2.0 * PI;
const vec2 P_MINUS = vec2(-0.72, -0.3);
const vec2 P_PLUS = vec2(0.78, 0.38);
const vec2 SMILEY_A = vec2(0.08, -0.04);
const vec2 CIRCLE_CENTER = vec2(-0.2932632, -0.2052643);
const float SMILEY_A_SCALE = 0.27;
const float TRANSLATION = 0.72;
const float TWIST = 2.1;
const float ORBIT_STEP = 0.48;
const float BRIDGE_STEP = 0.16;
const float RAIL_OFFSET = 1.85;
const float CAMERA_TANGENT_STEP = 0.01;
const int SMILEY_ITERATIONS = 26;
const int BRIDGE_ITERATIONS = 80;

float smoother(float x) {
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
  float d = max(dot(b, b), 1e-8);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d;
}

vec2 cexp(vec2 z) {
  return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

vec2 normalizePoint(vec2 z) {
  return cdiv(z - P_MINUS, z - P_PLUS);
}

vec2 denormalizePoint(vec2 w) {
  return cdiv(cmul(w, P_PLUS) - P_MINUS, w - vec2(1.0, 0.0));
}

vec2 applyLoxodromicFlow(vec2 w, float s) {
  return cmul(cexp(vec2(-TRANSLATION * s, TWIST * s)), w);
}

float loxodromicPhase(vec2 w) {
  return atan(w.y, w.x)
    + TWIST / TRANSLATION * log(max(length(w), 1e-6));
}

float phaseDistance(float a, float b) {
  float d = a - b;
  return abs(atan(sin(d), cos(d)));
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 segment = b - a;
  float along = clamp(dot(p - a, segment) / max(dot(segment, segment), 1e-8), 0.0, 1.0);
  return length(p - a - along * segment);
}

// p: world coordinates
// center: center of the bridge
float bridgeDistance(vec2 p, vec2 center) {
  vec2 logarithmicDerivative = cdiv(
    P_MINUS - P_PLUS,
    cmul(center - P_PLUS, center - P_MINUS)
  );
  float pitch = TWIST / TRANSLATION;
  vec2 gradient = vec2(
    logarithmicDerivative.y + pitch * logarithmicDerivative.x,
    logarithmicDerivative.x - pitch * logarithmicDerivative.y
  );
  float gradientLength = max(length(gradient), 1e-6);
  vec2 direction = gradient / gradientLength;

  // divide by jacobian
  float halfLength = 1.2 * (PI - RAIL_OFFSET) / gradientLength;
  return sdSegment(p, center - halfLength * direction, center + halfLength * direction);
}

vec3 gamingColor(float hue) {
  return 0.5 + 0.5 * cos(TAU * (hue + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)));
}

float smileyMask(vec2 p) {
  p = (p - SMILEY_A) / SMILEY_A_SCALE;
  vec2 o = p;
  p.x = abs(p.x);
  float mouthDistance = abs(length(p) - 0.55);
  float theta = atan(p.x, -p.y);
  float mouthWidth = mix(0.15, 0.05, smoothstep(0.0, 1.6, theta))
    * cos(clamp(30.0 * (theta - 1.4), -1.3, 1.6));
  float d = mouthDistance - mouthWidth;

  p -= vec2(0.2, 0.3);
  p.y *= 0.3;
  d = min(min(d, length(p) - 0.08),
          abs(length(o) - 0.8) - 0.02);
  return step(d, 0.0);
}

vec2 loxodromicOrbitTrap(vec2 p, vec2 w0, float phaseGap) {
  vec2 forwardStep = cexp(vec2(-TRANSLATION * ORBIT_STEP, TWIST * ORBIT_STEP));
  vec2 backwardStep = cexp(vec2(TRANSLATION * ORBIT_STEP, -TWIST * ORBIT_STEP));
  vec2 forwardBridgeStep = cexp(vec2(-TRANSLATION * BRIDGE_STEP, TWIST * BRIDGE_STEP));
  vec2 backwardBridgeStep = cexp(vec2(TRANSLATION * BRIDGE_STEP, -TWIST * BRIDGE_STEP));
  vec2 forwardOrbit = cmul(forwardStep, w0);
  vec2 backwardOrbit = cmul(backwardStep, w0);

  vec2 bridgeOrbit = normalizePoint(CIRCLE_CENTER);
  vec2 forwardBridgeOrbit = cmul(forwardBridgeStep, bridgeOrbit);
  vec2 backwardBridgeOrbit = cmul(backwardBridgeStep, bridgeOrbit);

  float smiley = smileyMask(p);
  float nearestBridgeDistance = bridgeDistance(p, CIRCLE_CENTER);

  for (int i = 0; i < BRIDGE_ITERATIONS; i++) {
    float forwardBridgeDistance = bridgeDistance(p, denormalizePoint(forwardBridgeOrbit));
    float backwardBridgeDistance = bridgeDistance(p, denormalizePoint(backwardBridgeOrbit));

    if (i < SMILEY_ITERATIONS) {
      smiley = max(smiley, smileyMask(denormalizePoint(forwardOrbit)));
      smiley = max(smiley, smileyMask(denormalizePoint(backwardOrbit)));
      forwardOrbit = cmul(forwardStep, forwardOrbit);
      backwardOrbit = cmul(backwardStep, backwardOrbit);
    }

    nearestBridgeDistance = min(
      nearestBridgeDistance,
      min(forwardBridgeDistance, backwardBridgeDistance)
    );

    forwardBridgeOrbit = cmul(forwardBridgeStep, forwardBridgeOrbit);
    backwardBridgeOrbit = cmul(backwardBridgeStep, backwardBridgeOrbit);

    if (smiley > 0.5) {
      break;
    }
  }

  float bridgePixels = nearestBridgeDistance / max(fwidth(nearestBridgeDistance), 1e-5);
  float bridge = 1.0 - smoothstep(0.85, 2.0, bridgePixels);
  float betweenRails = step(RAIL_OFFSET, phaseGap);
  bridge *= betweenRails;
  // x: smiley mask, y: bridge mask
  return vec2(smiley, bridge);
}

vec3 background(vec2 p) {
  vec2 w = normalizePoint(p);
  float centerPhase = loxodromicPhase(normalizePoint(SMILEY_A));
  float radiusLog = log(max(length(w), 1e-6));
  float orbitPhase = atan(w.y, w.x) + TWIST / TRANSLATION * radiusLog;
  float phaseGap = phaseDistance(orbitPhase, centerPhase);
  float railDistance = abs(phaseGap - RAIL_OFFSET);
  float railPixels = railDistance / max(fwidth(railDistance), 1e-5);
  float railCore = 1.0 - smoothstep(0.75, 1.65, railPixels);
  float railGlow = exp(-0.34 * railPixels);

  float hue = 0.1 * t + 0.16 * radiusLog;
  vec3 railColor = gamingColor(hue);
  vec3 col = railColor * mix(0.4 * railGlow, 1.0, railCore);

  vec2 trapMasks = loxodromicOrbitTrap(p, w, phaseGap);
  col = mix(col, railColor, trapMasks.y);
  col = mix(col, vec3(1.0, 1.0, 0.0), trapMasks.x);

  return col;
}

void main() {
  vec2 screen = v;
  screen.x *= 16.0 / 9.0;

  float motionTime = 1.25 * t;

  float phase = fract(0.03 * motionTime);
  float leg = 1.0 - abs(2.0 * phase - 1.0);
  float eased = mix(leg, smoother(leg), 0.65);
  float pingPong = mix(-1.0, 1.0, eased);
  float cameraPathParameter = 5.8 * pingPong;
  vec2 normalizedCameraStart = normalizePoint(SMILEY_A);
  vec2 normalizedCameraPosition = applyLoxodromicFlow(
    normalizedCameraStart,
    cameraPathParameter
  );
  vec2 cameraPosition = denormalizePoint(normalizedCameraPosition);

  vec2 normalizedCameraNext = applyLoxodromicFlow(
    normalizedCameraPosition,
    CAMERA_TANGENT_STEP
  );
  vec2 cameraNextPosition = denormalizePoint(normalizedCameraNext);
  vec2 forward = normalize(cameraNextPosition - cameraPosition);
  vec2 right = vec2(forward.y, -forward.x);
  mat2 cameraBasis = mat2(right, forward);

  vec2 targetFixedPoint = cameraPathParameter >= 0.0 ? P_MINUS : P_PLUS;
  float fixedPointDistance = length(cameraPosition - targetFixedPoint);
  float centerLock = 1.0 - smoothstep(0.025, 0.1, fixedPointDistance);
  centerLock *= centerLock;
  vec2 cameraCenter = mix(cameraPosition, targetFixedPoint, centerLock);

  float fixedMotionTime = 1.5 * motionTime;
  float lockedRoll = centerLock * (
    0.16 * sin(1.1 * fixedMotionTime)
    + 0.045 * sin(2.7 * fixedMotionTime)
  );
  cameraBasis *= r2d(lockedRoll);

  float targetScale = clamp(0.62 * fixedPointDistance, 0.006, 0.34);
  float zoomPhase = smoothstep(0.25, 0.9, abs(pingPong));
  zoomPhase *= zoomPhase;
  float worldScale = mix(0.34, targetScale, zoomPhase);
  float lockedBreath = 1.0 + centerLock * (
    0.075 * sin(0.9 * fixedMotionTime)
    + 0.025 * sin(2.3 * fixedMotionTime)
  );
  worldScale *= lockedBreath;

  vec2 world = cameraCenter + cameraBasis * screen * worldScale;
  vec3 col = background(world);

  outColor = vec4(col, 1.0);
}
