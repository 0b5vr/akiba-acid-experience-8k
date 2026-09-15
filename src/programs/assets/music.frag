#version 300 es

//[
precision highp float;
//]

// #pragma shader_minifier_plugin bypass

// Constants
const int TEXTURE_WIDTH = 4096;
const float SAMPLE_RATE = 48000.0;

const float TARGET_BPM = 140.0;
const int STEP_SAMPLES = int(60.0 / 4.0 / TARGET_BPM * SAMPLE_RATE);
const float S2T = float(STEP_SAMPLES) / SAMPLE_RATE;
const float B2T = float(STEP_SAMPLES * 4) / SAMPLE_RATE;

const float LN2 = log(2.0);
const float PI = acos(-1.0);
const float TAU = PI * 2.0;

const float SWING = 0.54;
const float TRANSPOSE = 3.0;

out vec2 fragColor;

float samplesToTime(int samples) {
  return float(samples) / SAMPLE_RATE;
}

int floorMod(int a, int b) {
  return (a % b + b) % b;
}

int floorDiv(int a, int b) {
  return (a - floorMod(a, b)) / b;
}

// Ref: https://www.shadertoy.com/view/XlXcW4
vec3 hash3f(vec3 s) {
  uvec3 r = floatBitsToUint(s);
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  r = ((r >> 16u) ^ r.yzx) * 1111111111u;
  return vec3(r) / float(-1u);
}

vec2 cis(float t) {
  return vec2(cos(t), sin(t));
}

mat2 r2d(float t) {
  return mat2(cos(t), sin(t), -sin(t), cos(t));
}

int samplesToStepSwing(int samples) {
  const int TWO_STEP_SAMPLES = STEP_SAMPLES * 2;
  const int SWING_STEP_SAMPLES = int(float(TWO_STEP_SAMPLES) * SWING);
  return floorDiv(samples, TWO_STEP_SAMPLES) * 2 + (floorMod(samples, TWO_STEP_SAMPLES) < SWING_STEP_SAMPLES ? 0 : 1);
}

int stepToSamplesSwing(int st) {
  const int TWO_STEP_SAMPLES = STEP_SAMPLES * 2;
  const int SWING_STEP_SAMPLES = int(float(TWO_STEP_SAMPLES) * SWING);
  return floorDiv(st, 2) * TWO_STEP_SAMPLES + (floorMod(st, 2) == 0 ? 0 : SWING_STEP_SAMPLES);
}

vec4 seq16(int samples, int seq) {
  const int BAR_SAMPLES = STEP_SAMPLES * 16;
  samples = floorMod(samples, BAR_SAMPLES);
  int sti = samplesToStepSwing(samples);

  int rotated = ((seq >> (15 - sti)) | (seq << (sti + 1))) & 0xffff;

  int i_prevStepBehind = int(log2(float(rotated & -rotated)));
  int prevStep = sti - i_prevStepBehind;
  int prevSamples = stepToSamplesSwing(prevStep);
  int i_nextStepForward = 16 - int(log2(float(rotated)));
  int nextStep = sti + i_nextStepForward;
  int nextSamples = stepToSamplesSwing(nextStep);

  return vec4(
    prevStep,
    samplesToTime(samples - prevSamples),
    nextStep,
    samplesToTime(nextSamples - samples)
  );
}

float p2f(float p) {
  return exp2((p - 69.0) / 12.0) * 440.0;
}

vec2 ladderLPF(float freq, float cutoff, float reso) {
  float omega = freq / cutoff;
  float omegaSq = omega * omega;

  float a = 4.0 * omega * (omegaSq - 1.0);
  float b = 4.0 * reso + omegaSq * omegaSq - 6.0 * omegaSq + 1.0;

  return vec2(
    1.0 / sqrt(a * a + b * b),
    atan(a, b)
  );
}

float glidephase(float t, float t1, float p0, float p1) {
  if (p0 == p1 || t1 == 0.0) {
    return t * p2f(p1);
  }

  float m0 = (p0 - 69.0) / 12.0;
  float m1 = (p1 - 69.0) / 12.0;
  float b = (m1 - m0) / t1;

  return (
    + p2f(p0) * (
      + min(t, 0.0)
      + (pow(2.0, b * clamp(t, 0.0, t1)) - 1.0) / b / LN2
    )
    + max(0.0, t - t1) * p2f(p1)
  );
}

mat3 orthBas(vec3 z) {
  z = normalize(z);
  vec3 x = normalize(cross(vec3(0, 1, 0), z));
  vec3 y = cross(z, x);
  return mat3(x, y, z);
}

vec3 cyclic(vec3 p, float pers, float lacu) {
  vec4 sum = vec4(0);
  mat3 rot = orthBas(vec3(2, -3, 1));

  for (int i = 0; i < 5; i++) {
    p *= rot;
    p += sin(p.zxy);
    sum += vec4(cross(cos(p), sin(p.yzx)), 1);
    sum /= pers;
    p *= lacu;
  }

  return sum.xyz / sum.w;
}

void main() {
  // Sample index calculated from pixel coordinates
  int sampleIndex = int(gl_FragCoord.x) + int(gl_FragCoord.y) * TEXTURE_WIDTH;

  vec2 dest = vec2(0);

  const int BEAT_SAMPLES = STEP_SAMPLES * 4;
  const int BAR_SAMPLES = STEP_SAMPLES * 16;

  float timeGlobal = samplesToTime(sampleIndex);
  float timeBeat = samplesToTime(sampleIndex % BEAT_SAMPLES);
  float bars = timeGlobal / B2T / 4.0;

  int eightBarIndex = sampleIndex / (BAR_SAMPLES * 8);

  float duck = smoothstep(0.0, 0.4, timeBeat) * smoothstep(0.0, 0.001, B2T - timeBeat);

  if (eightBarIndex >= 2 && eightBarIndex < 18) { // kick
    float t = timeBeat;
    float q = B2T - t;
  
    float env = smoothstep(0.0, 0.001, q) * exp(-20.0 * max(t - 0.1, 0.0));
    if (eightBarIndex == 5 || eightBarIndex == 13) {
      env *= exp(-50.0 * t);
    }
  
    {
      float tt = t;
      float wave = 0.0;
  
      wave += tanh(2.5 * sin(TAU * (
        50.0 * tt
        - 8.0 * exp2(-tt * 33.0)
      )));
  
      float tick = env * exp2(-500.0 * t);
      wave += env * tanh(1.5 * sin(TAU * 3.0 * tick));
  
      dest += 0.7 * env * wave;
    }
  }

  if (eightBarIndex >= 3 && eightBarIndex < 11 || eightBarIndex >= 14 && eightBarIndex < 17) { // hihat
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0xffff);
    float t = seq.y;

    float envseq[] = float[](
      0.0, 0.0, 0.0, 0.0,
      0.0, 0.0, 0.0, 1.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.3, 0.5, 1.0
    );
    float kenv = exp2(mix(7.5, 5.0, envseq[int(seq.s)]));
    float env = exp2(-kenv * t);

    vec2 sum = vec2(0.0);

    for (int i = 0; i < 8; i++) {
      vec3 dice = hash3f(vec3(i, 8, 8));
      vec3 dice2 = hash3f(dice);

      vec2 wave = vec2(0.0);
      wave = 4.5 * exp2(-10.0 * t) * sin(wave + exp2(13.30 + 0.1 * dice.x) * t + dice2.xy);
      wave = 3.2 * exp2(-10.0 * t) * sin(wave + exp2(11.78 + 0.3 * dice.y) * t + dice2.yz);
      wave = 1.0 * exp2(-10.0 * t) * sin(wave + exp2(14.92 + 0.2 * dice.z) * t + dice2.zx);

      sum += wave;
    }

    dest += 0.2 * env * mix(0.5, 1.0, duck) * tanh(2.0 * sum);
  }

  if (eightBarIndex >= 4 && eightBarIndex < 11 || eightBarIndex >= 14 && eightBarIndex < 16) { // clap
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0x2001);
    float t = seq.y;

    float env = mix(
      exp2(-40.0 * t),
      exp2(-300.0 * mod(t, 0.01)),
      exp2(-100.0 * max(0.0, t - 0.02))
    );

    float radius = 2.0 + 2.0 * exp(-20.0 * t);
    float phase = 420.0 * t;
    vec2 wave = cyclic(vec3(radius * cis(TAU * phase), TAU * phase), 0.6, 2.0).xy;

    dest += 0.2 * mix(0.8, 1.0, duck) * tanh(20.0 * env * wave);
  }

  if (eightBarIndex >= 6 && eightBarIndex < 11 || eightBarIndex >= 12 && eightBarIndex < 16) { // snare909
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0x2543);
    float t = seq.t;
    float q = seq.q;

    float env = exp(-20.0 * max(t - 0.04, 0.0)) * smoothstep(0.0, 0.01, q);

    float sinphase = 234.0 * t - 4.0 * exp2(-t * 200.0);
    float noisephase = 1000.0 * t;
    vec2 wave = mix(
      mix(
        cis(TAU * (sinphase)),
        cis(TAU * (1.5 * sinphase)),
        0.3
      ),
      cyclic(vec3(cis(TAU * noisephase), TAU * noisephase), 2.0, 2.0).xy,
      0.3
    );

    dest += 0.3 * mix(0.5, 1.0, duck) * tanh(4.0 * env * wave);
  }

  if (eightBarIndex >= 2 && eightBarIndex < 18) { // toms
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0x1252);
    float t = seq.y;

    bool hi = mod(seq.x, 8.0) < 4.0;

    float env = exp(-20.0 * t);
    float freq = hi ? 110.0 : 80.0;
    float phase = (
      t
      - 0.03 * exp2(-40.0 * t)
      - 0.01 * exp2(-150.0 * t)
    );
    phase *= TAU * freq;

    vec2 wave = cis(phase + sin(3.0 * phase) + 10.0 * t);
    wave *= hi ? vec2(0.5, 1.0) : vec2(1.0, 0.5);

    dest += 0.2 * mix(0.8, 1.0, duck) * tanh(2.0 * env * wave);
  }

  if (eightBarIndex >= 2 && eightBarIndex < 18) { // rim
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0xd6d7);
    float t = seq.y;

    float env = step(0.0, t) * exp2(-400.0 * t);

    float wave = tanh(4.0 * (
      + sin(t * 2400.0 - 3.0 * env)
      + sin(t * 9000.0 - 3.0 * env)
    ));

    dest += 0.2 * mix(0.8, 1.0, duck) * env * vec2(wave) * r2d(seq.x);
  }

  if (eightBarIndex >= 6 && eightBarIndex < 10 || eightBarIndex >= 14 && eightBarIndex < 17) { // ride
    float t = seq16(sampleIndex % BAR_SAMPLES, 0x2222).y;

    float env = exp(-2.0 * t);

    vec2 sum = vec2(0.0);

    for (int i = 0; i < 8; i++) {
      vec3 dice = hash3f(vec3(i, 8, 8));
      vec3 dice2 = hash3f(dice);

      vec2 wave = vec2(0.0);
      wave = 2.5 * env * sin(wave + exp2(14.90 + 0.1 * dice.x) * t + dice2.xy);
      wave = 4.2 * env * sin(wave + exp2(13.27 + 0.5 * dice.y) * t + dice2.yz);
      wave = 1.0 * env * sin(wave + exp2(13.89 + 1.0 * dice.z) * t + dice2.zx);

      sum += wave;
    }

    dest += 0.15 * mix(0.2, 1.0, duck) * env * tanh(sum);
  }

  if (eightBarIndex >= 2) { // crash
    float t = samplesToTime(sampleIndex % (16 * BAR_SAMPLES));

    float env = mix(exp(-t), exp(-10.0 * t), 0.7);

    // 64 partials shotgun
    vec2 wave = vec2(0.0);
    for (int i = 0; i < 64; i++) {
      vec2 i_xi = hash3f(vec3(i, 64, 64)).xy;
      vec2 i_partial = exp2(2.0 * i_xi);
      vec2 phase = TAU * 3800.0 * t * i_partial;
      wave += sin(phase + sin(phase));
    }

    // dest += 0.4 * env * mix(0.5, 1.0, duck) * tanh(8.0 * (wave / 64.0));
    dest += 0.4 * env * mix(0.5, 1.0, duck) * tanh(0.125 * wave);
  }

  if (eightBarIndex == 5 || eightBarIndex == 13) { // snare roll
    float fade = smoothstep(0.0, 1.0, fract(bars / 8.0));
  
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0xffff);
    float t = seq.t;
    float q = seq.q;
  
    if (mod(bars, 8.0) > 7.0) {
      float l = 0.125 * B2T;
      t = mod(timeBeat, l);
      q = l - t;
    }
  
    float env = smoothstep(0.0, 0.01, q);
    env *= mix(
      exp(-10.0 * max(t - 0.04, 0.0)),
      exp(-80.0 * t),
      0.3
    );

    float sinphase = 234.0 * t - 4.0 * exp2(-t * 200.0);
    float noisephase = 1000.0 * t;
    vec2 wave = mix(
      mix(
        cis(TAU * (sinphase)),
        cis(TAU * (1.5 * sinphase)),
        0.3
      ),
      cyclic(vec3(cis(TAU * noisephase), TAU * noisephase), 2.0, 2.0).xy,
      0.3
    );
  
    dest += 0.3 * fade * mix(0.3, 1.0, duck) * tanh(4.0 * env * wave);
  }

  { // acid
    const int N_NOTES = 5;
    const int NOTES[N_NOTES] = int[](0, 12, 18, 3, 9);
    const int SLIDE[N_NOTES] = int[](0, -12, 0, 12, -12);
    float SLIDE_T0 = 0.8 * S2T;
    float SLIDE_TIME = 0.6 * S2T;

    float cutoffKnobHi = 0.7 + 0.1 * (sin(timeGlobal) + sin(1.41 * timeGlobal) + sin(1.88 * timeGlobal));
    float cutoffKnob = 0.3 * smoothstep(14.0, 20.0, bars);
    cutoffKnob = mix(cutoffKnob, cutoffKnobHi, smoothstep(40.0, 48.0, bars));
    cutoffKnob = mix(cutoffKnob, 0.6, smoothstep(79.0, 80.0, bars));
    cutoffKnob = mix(cutoffKnob, cutoffKnobHi, smoothstep(104.0, 112.0, bars));
    cutoffKnob = mix(cutoffKnob, 0.5, smoothstep(127.0, 129.0, bars));
    cutoffKnob = mix(cutoffKnob, 0.3, smoothstep(136.0, 144.0, bars));

    float resoKnob = 0.9 * smoothstep(40.0, 48.0, bars);
    resoKnob = mix(resoKnob, 0.7, smoothstep(127.0, 129.0, bars));

    float dissonanceKnob = 0.2 * step(88.0, bars);

    int basestep = samplesToStepSwing(sampleIndex);
    float seqi = floor(float(basestep) / 1.15);
    float stepS = ceil(seqi * 1.15);
    float stepP = ceil((seqi + 1.0) * 1.15);
    int samplesS = stepToSamplesSwing(int(stepS));
    int samplesP = stepToSamplesSwing(int(stepP));
    float t = samplesToTime(sampleIndex - samplesS);
    float q = samplesToTime(samplesP - sampleIndex);
  
    q -= mix(0.01, 0.15 * B2T, fract(seqi * 0.389));
    float env = smoothstep(0.0, 0.001, t) * smoothstep(0.0, 0.01, q);
  
    float cenv = smoothstep(0.0, 0.01, t) * exp(-8.0 * t);
    float cutoff = (
      6.0
      + exp2(mix(-2.0, 2.0, fract(seqi * 0.612))) * cenv
      + 5.0 * cutoffKnob
    );
    float cfreq = exp2(cutoff);
  
    int i = int(seqi) % N_NOTES;
    float pitch = 36.0 + TRANSPOSE + float(NOTES[i]);
    float pitch1 = pitch + float(SLIDE[i]);
    float basefreq = p2f(mix(pitch, pitch1, clamp((t - SLIDE_T0) / SLIDE_TIME, 0.0, 1.0)));
    float basephase = glidephase(t - SLIDE_T0, SLIDE_TIME, pitch, pitch1);
  
    vec2 sum = vec2(0.0);
  
    { // sub
      float phase = 0.5 * basephase;
      dest += 0.3 * env * tanh(1.5 * sin(TAU * phase));
    }
  
    for (int i = 0; i < 128; i++) { // acid
      float fi = float(i);
  
      float p = 1.0 + 1.0 * fi;
      p = mix(p, 8.0, dissonanceKnob);
      float freq = basefreq * p;
      float coeff = exp(-0.1 * p);
  
      vec2 filt = ladderLPF(freq, cfreq, resoKnob);
      float phase = basephase * p;
      // phase += TAU * dice.z;
  
      sum += sin(TAU * phase + filt.y) * env * coeff * filt.x;
    }
  
    float bias = -0.4;
    dest += 0.25 * mix(0.8, 1.0, duck) * (clamp(4.0 * (sum + bias), -1.0, 1.0) - bias);
  }

  fragColor = clamp(1.3 * tanh(dest) * smoothstep(152.0, 144.0, bars), -1.0, 1.0);
}
