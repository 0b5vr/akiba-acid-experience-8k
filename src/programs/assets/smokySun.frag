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

mat3 orthbas(vec3 z) {
  z = normalize(z);
  vec3 up = abs(z.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  vec3 x = normalize(cross(up, z));
  return mat3(x, cross(z, x), z);
}

float fbm(vec2 p) {
  return 0.5 + 0.5 * texture(f, p).x;
}

vec3 cyclic(vec3 p, float pers, float lacu) {
  vec4 sum = vec4(0);
  mat3 rot = orthbas(vec3(2, -3, 1));

  for (int i = 0; i < 5; i++) {
    p *= rot;
    p += sin(p.zxy);
    sum += vec4(cross(cos(p), sin(p.yzx)), 1);
    sum /= pers;
    p *= lacu;
  }

  return sum.xyz / sum.w;
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

  vec3 noiseP = vec3(2.0 * cos(a), 2.0 * sin(a), 1.5 * radialPhase - 0.3 * t);
  float bendNoise = cyclic(noiseP + noise * 0.2, .8, 1.3).x;
  float bendEnvelope = smoothstep(0.0, 0.5, radialPhase);

  float phase =
    rays * a
    + 5.0 * bendEnvelope * bendNoise;

  float lengthNoise = 0.5 + 0.5 * cyclic(vec3(
    1.7 * cos(a),
    1.7 * sin(a),
    .1 * t
  ), 0.5, 2.0).y;

  float rayLength = mix(0.8, 1.2, lengthNoise);

  float rayProgress = clamp(radialPhase, 0.0, 1.0);
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

vec2 borderCoord(vec2 uv) {
  float bottom = uv.y;
  float top = 1.0 - uv.y;
  float depth = min(bottom, top);

  float perimeter;
  if (bottom == depth) {
    perimeter = 0.5 * uv.x;
  } else {
    perimeter = 0.5 + 0.5 * (1.0 - uv.x);
  }

  return vec2(perimeter, depth);
}

float borderHalo(vec2 uv, float rays) {
  vec2 border = borderCoord(uv);
  float perimeter = border.x;
  float depth = border.y;
  float angle = 6.28318530718 * perimeter;

  vec3 noiseP = vec3(
    2.0 * cos(angle),
    2.0 * sin(angle),
    8.0 * depth - 0.3 * t
  );
  float bendNoise = cyclic(noiseP, 0.8, 1.3).x;
  float bendEnvelope = smoothstep(0.0, 0.12, depth);
  float phase = rays * angle + 5.0 * bendEnvelope * bendNoise;

  float lengthNoise = 0.5 + 0.5 * cyclic(vec3(
    1.7 * cos(angle),
    1.7 * sin(angle),
    0.1 * t
  ), 0.8, 2.0).y;
  float rayLength = mix(0.12, 0.45, lengthNoise);

  float rayProgress = clamp(depth / 0.45, 0.0, 1.0);
  float ray = pow(
    0.5 + 0.5 * cos(phase),
    mix(8.0, 48.0, rayProgress)
  );
  float inner = 1.0 - smoothstep(
    rayLength - 0.04,
    rayLength,
    depth
  );

  return ray * inner;
}

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float sdtriangle(vec2 p, float r) {
    const float SQRT3 = sqrt(3.0);

    p.x = abs(p.x) - r;
    p.y += r / SQRT3;

    if (p.x + SQRT3 * p.y > 0.0) {
      p = vec2(
        p.x - SQRT3 * p.y,
        -SQRT3 * p.x - p.y
      ) / 2.0;
    }

    p.x -= clamp(p.x, -2.0 * r, 0.0);

    return -length(p) * sign(p.y);
  }

  float sdhexagram(vec2 p, float r) {
    float upward = sdtriangle(p, r);
    float downward = sdtriangle(-p, r);
    return min(upward, downward);
  }


  float sdCrescent(
    vec2 p,
    float outerRadius,
    float innerRadius,
    vec2 cutOffset
  ) {
    float outer = length(p) - outerRadius;
    float cut = length(p- cutOffset) - innerRadius;

    return max(outer, -cut);
  }

vec3 sunColor(vec2 uv) {
  vec2 p = uv - 0.5;
  p.x *= ASPECT;
  float rt = 0.5 * t;
    mat2 rotation = mat2(cos(rt), sin(rt), -sin(rt), cos(rt));


  float pulseRadius = 0.1 + 0.1 * exp(-8.0 * mod(t, 1.0 / BPS));
  if (sdhexagram(rotation * (p - vec2(0.6, 0.0)), 0.12) < 0.0) {
    return vec3(0.55, 0.0, 0.02);
  }

  if (sdCrescent((p - vec2(-.6, 0.)) * rotation, 0.13, 0.13, vec2(0.11, 0.03)) < 0.0) {
    return vec3(0.55, 0.0, 0.02);
  }

  float halo = sunHalo(
    p ,
    0.3,
    0.5,
    24.0
  );
  halo = max(0., borderHalo(uv, 48.0));
  vec3 bgColor = vec3(0.9215, 0.54117, 0.1294);
  float grain = hash(vec3(
      gl_FragCoord.xy,
      floor(13.0 )
    )) - 0.5;
  float colorNoise = cyclic(
    vec3(2.0 * p, 0.5),
    0.7,
    1.6
  ).x;
   // bgColor *= 1.0 + 0.14 * grain;
  vec3 c = mix(bgColor, vec3(0.55, 0.16, 0.02), colorNoise);
  return mix(bgColor, vec3(0), smoothstep(0.0, 0.1, halo));
}

// -- main ----------------------------------------------------------------------------------------
void main() {
  vec2 uv = 0.5 + 0.5 * v;
  float density = smokeDensity(uv);
  vec3 color = sunColor(uv);

  float grain = hash(vec3(
    gl_FragCoord.xy,
    floor(13.0)
  )) - 0.5;
  color *= 1.0 + 0.14 * grain;
  color = mix(color, vec3(1.0), density);

  outColor = vec4(color, 1.0);
}
