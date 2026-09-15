#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float PI = acos(-1.0);
const vec2 P_MINUS = vec2(-0.72, -0.3);
const vec2 P_PLUS = vec2(0.78, 0.38);
const vec2 SMILEY_A = vec2(0.08, -0.04);
const float SMILEY_A_SCALE = 0.27;
const float TRANSLATION = 0.72;
const float TWIST = 2.1;
const float ORBIT_STEP = 0.48;
const float BRIDGE_STEP = 0.16;
const float RAIL_OFFSET = 1.85;
// Precomputed from P_MINUS, P_PLUS, SMILEY_A, TRANSLATION and TWIST.
// normalizePoint(SMILEY_A)
const vec2 NORMALIZED_SMILEY_A = vec2(-1.0042017, 0.2310924);
// normalizePoint(vec2(-0.2932632, -0.2052643))
const vec2 NORMALIZED_CIRCLE_CENTER = vec2(-0.3435738, 0.0990864);
// atan(w.y, w.x) + TWIST / TRANSLATION * log(length(w)), w = NORMALIZED_SMILEY_A
const float CENTER_PHASE = 3.0028888;
// cexp(vec2(-TRANSLATION, TWIST) * 0.01)
const vec2 CAMERA_TANGENT_FACTOR = vec2(0.9926069, 0.0208478);
const int SMILEY_ITERATIONS = 26;
const int BRIDGE_ITERATIONS = 80;

float smoother(float x) {
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
  float d = dot(b, b);
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
  return P_PLUS + cdiv(P_PLUS - P_MINUS, w - vec2(1.0, 0.0));
}

vec2 applyLoxodromicFlow(vec2 w, float s) {
  return cmul(cexp(vec2(-TRANSLATION * s, TWIST * s)), w);
}

float phaseDistance(float a, float b) {
  return abs(mod(a - b + PI, 2.0 * PI) - PI);
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
  // Project onto the centered segment in phase units, avoiding normalization.
  vec2 offset = p - center;
  float halfPhase = 1.2 * (PI - RAIL_OFFSET);
  return length(offset - gradient * clamp(
    dot(offset, gradient), -halfPhase, halfPhase
  ) / dot(gradient, gradient));
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

float sdsmileycircle(vec2 p) {
  return min(
    abs(length(p) - 0.8) - 0.02,
    sdsmiley(p)
  );
}

float smileyMask(vec2 p) {
  return step(sdsmileycircle((p - SMILEY_A) / SMILEY_A_SCALE), 0.0);
}

vec2 loxodromicOrbitTrap(vec2 p, vec2 w0, float phaseGap) {
  vec2 bridgeOrbit = NORMALIZED_CIRCLE_CENTER;

  float smiley = 0.0;
  float nearestBridgeDistance = 1e3;

  for (int i = -BRIDGE_ITERATIONS; i <= BRIDGE_ITERATIONS; i++) {
    float s = float(i);

    nearestBridgeDistance = min(nearestBridgeDistance, bridgeDistance(
      p,
      denormalizePoint(applyLoxodromicFlow(bridgeOrbit, BRIDGE_STEP * s))
    ));

    if (abs(i) <= SMILEY_ITERATIONS) {
      smiley = max(smiley, smileyMask(
        denormalizePoint(applyLoxodromicFlow(w0, ORBIT_STEP * s))
      ));
    }
  }

  float bridgePixels = nearestBridgeDistance / fwidth(nearestBridgeDistance);
  float bridge = 1.0 - smoothstep(0.85, 2.0, bridgePixels);
  float betweenRails = step(RAIL_OFFSET, phaseGap);
  bridge *= betweenRails;
  // x: smiley mask, y: bridge mask
  return vec2(smiley, bridge);
}

vec3 background(vec2 p) {
  vec2 w = normalizePoint(p);
  float radiusLog = log(length(w));
  float phase = atan(w.y, w.x) + TWIST / TRANSLATION * radiusLog;
  float phaseGap = phaseDistance(phase, CENTER_PHASE);
  float railDistance = abs(phaseGap - RAIL_OFFSET);
  float railPixels = railDistance / fwidth(railDistance);
  float railCore = 1.0 - smoothstep(0.75, 1.65, railPixels);
  float railGlow = exp(-0.34 * railPixels);

  float hue = 0.6 * t + radiusLog;
  vec3 railColor = 0.5 + 0.5 * cos(vec3(0, 2, 4) - hue);
  float brightness = mix(0.4 * railGlow, 1.0, railCore);

  vec2 trapMasks = loxodromicOrbitTrap(p, w, phaseGap);
  brightness = mix(brightness, 1.0, trapMasks.y);
  vec3 col = mix(railColor * brightness, vec3(1.0, 1.0, 0.0), trapMasks.x);

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
  vec2 normalizedCameraStart = NORMALIZED_SMILEY_A;
  vec2 normalizedCameraPosition = applyLoxodromicFlow(
    normalizedCameraStart,
    cameraPathParameter
  );
  vec2 cameraPosition = denormalizePoint(normalizedCameraPosition);

  vec2 normalizedCameraNext = cmul(
    normalizedCameraPosition,
    CAMERA_TANGENT_FACTOR
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
