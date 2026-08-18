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

#define saturate(x) clamp(x, 0., 1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define clip(x) clamp(x, -1., 1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define tri(p) (1.-4.*abs(fract(p)-0.5))

out vec2 fragColor;

float samplesToTime(int samples) {
  return float(samples) / SAMPLE_RATE;
}

uvec3 hash3u(uvec3 v) {
  v = v * 1145141919u + 1919810u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  return v;
}

int floorMod(int a, int b) {
  return (a % b + b) % b;
}

int floorDiv(int a, int b) {
  return (a - floorMod(a, b)) / b;
}

vec3 hash3f(vec3 v) {
  uvec3 x = floatBitsToUint(v);
  return vec3(hash3u(x)) / float(-1u);
}

vec2 cis(float t) {
  return vec2(cos(t), sin(t));
}

mat2 rotate2D(float x) {
  vec2 v = cis(x);
  return mat2(v.x, v.y, -v.y, v.x);
}

float t2sSwing(float t) {
  float st = 4.0 * t / B2T;
  return 2.0 * floor(st / 2.0) + step(SWING, fract(0.5 * st));
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

float s2tSwing(float st) {
  return B2T * 0.5 * (floor(st / 2.0) + SWING * mod(st, 2.0));
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

vec2 shotgun(float t, float spread, float snap, float fm) {
  vec2 sum = vec2(0.0);

  for (int i = 0; i < 64; i++) {
    vec3 dice = hash3f(vec3(i + 1));

    vec2 partial = exp2(spread * dice.xy);
    partial = mix(partial, floor(partial + 0.5), snap);

    sum += sin(TAU * t * partial + fm * sin(TAU * t * partial));
  }

  return sum / 64.0;
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

vec2 cheapnoise(float t) {
  uvec3 s=uvec3(t * 256.0);
  float p=fract(t * 256.0);

  vec3 dice;
  vec2 v = vec2(0.0);

  dice=vec3(hash3u(s + 0u)) / float(-1u) - vec3(0.5, 0.5, 0.0);
  v += dice.xy * smoothstep(1.0, 0.0, abs(p + dice.z));
  dice=vec3(hash3u(s + 1u)) / float(-1u) - vec3(0.5, 0.5, 1.0);
  v += dice.xy * smoothstep(1.0, 0.0, abs(p + dice.z));
  dice=vec3(hash3u(s + 2u)) / float(-1u) - vec3(0.5, 0.5, 2.0);
  v += dice.xy * smoothstep(1.0, 0.0, abs(p + dice.z));

  return 2.0 * v;
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

  int barIndex = sampleIndex / BAR_SAMPLES;

  float duck = smoothstep(0.0, 0.4, timeBeat) * smoothstep(0.0, 0.001, B2T - timeBeat);

  if (barIndex >= 16 && barIndex < 144) { // kick
    float t = timeBeat;
    float q = B2T - t;
  
    float env = smoothstep(0.0, 0.001, q) * exp(-20.0 * max(t - 0.1, 0.0));
    if (barIndex / 8 == 5 || barIndex / 8 == 13) {
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
  
      dest += 0.6 * env * wave;
    }
  }

  if (barIndex >= 24 && barIndex < 88 || barIndex >= 112 && barIndex < 136) { // hihat
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
      vec3 dice = hash3f(vec3(i));
      vec3 dice2 = hash3f(dice);

      vec2 wave = vec2(0.0);
      wave = 4.5 * exp2(-10.0 * t) * sin(wave + exp2(13.30 + 0.1 * dice.x) * t + dice2.xy);
      wave = 3.2 * exp2(-10.0 * t) * sin(wave + exp2(11.78 + 0.3 * dice.y) * t + dice2.yz);
      wave = 1.0 * exp2(-10.0 * t) * sin(wave + exp2(14.92 + 0.2 * dice.z) * t + dice2.zx);

      sum += wave;
    }

    dest += 0.2 * env * mix(0.5, 1.0, duck) * tanh(2.0 * sum);
  }

  if (barIndex >= 32 && barIndex < 88 || barIndex >= 112 && barIndex < 128) { // clap
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0x2001);
    float t = seq.y;
    float q = seq.w;

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

  if (barIndex >= 48 && barIndex < 88 || barIndex >= 96 && barIndex < 128) { // snare909
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0x2543);
    float t = seq.t;
    float q = seq.q;

    float env = exp(-20.0 * max(t - 0.04, 0.0)) * smoothstep(0.0, 0.01, q);

    float sinphase = 234.0 * t - 4.0 * exp2(-t * 200.0);
    float noisephase = 128.0 * t;
    vec2 wave = mix(
      mix(
        cis(TAU * (sinphase)),
        cis(TAU * (1.5 * sinphase)),
        0.3
      ),
      cheapnoise(noisephase) - cheapnoise(noisephase - 0.004),
      0.3
    );

    dest += 0.3 * mix(0.5, 1.0, duck) * tanh(4.0 * env * wave);
  }

  if (barIndex >= 16 && barIndex < 144) { // hi tom
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0x1050);
    float t = seq.y;
    float q = seq.w;

    float env = exp(-20.0 * t);
    float freq = 110.0;
    float phase = (
      t
      - 0.03 * exp2(-40.0 * t)
      - 0.01 * exp2(-150.0 * t)
    );
    phase *= TAU * freq;

    vec2 wave = cis(phase + sin(3.0 * phase) + 10.0 * t);
    wave.x *= 0.5;

    dest += 0.2 * mix(0.8, 1.0, duck) * tanh(2.0 * env * wave);
  }

  if (barIndex >= 16 && barIndex < 144) { // low tom
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0x0202);
    float t = seq.y;
    float q = seq.w;

    float env = exp(-20.0 * t);
    float freq = 80.0;
    float phase = (
      t
      - 0.03 * exp2(-40.0 * t)
      - 0.01 * exp2(-150.0 * t)
    );
    phase *= TAU * freq;

    vec2 wave = cis(phase + sin(3.0 * phase) + 10.0 * t);
    wave.y *= 0.5;

    dest += 0.2 * mix(0.8, 1.0, duck) * tanh(2.0 * env * wave);
  }

  if (barIndex >= 16 && barIndex < 144) { // rim
    vec4 seq = seq16(sampleIndex % BAR_SAMPLES, 0xd6d7);
    float t = seq.y;

    float env = step(0.0, t) * exp2(-400.0 * t);

    float wave = tanh(4.0 * (
      + tri(t * 400.0 - 0.5 * env)
      + tri(t * 1500.0 - 0.5 * env)
    ));

    dest += 0.2 * mix(0.8, 1.0, duck) * env * vec2(wave) * rotate2D(seq.x);
  }

  if (barIndex >= 48 && barIndex < 80 || barIndex >= 112 && barIndex < 136) { // ride
    float t = seq16(sampleIndex % BAR_SAMPLES, 0x2222).y;

    float env = exp(-2.0 * t);

    vec2 sum = vec2(0.0);

    for (int i = 0; i < 8; i++) {
      vec3 dice = hash3f(vec3(i));
      vec3 dice2 = hash3f(dice);

      vec2 wave = vec2(0.0);
      wave = 2.5 * env * sin(wave + exp2(14.90 + 0.1 * dice.x) * t + dice2.xy);
      wave = 4.2 * env * sin(wave + exp2(13.27 + 0.5 * dice.y) * t + dice2.yz);
      wave = 1.0 * env * sin(wave + exp2(13.89 + 1.0 * dice.z) * t + dice2.zx);

      sum += wave;
    }

    dest += 0.15 * mix(0.2, 1.0, duck) * env * tanh(sum);
  }

  if (barIndex >= 16) { // crash
    float t = samplesToTime(sampleIndex % (16 * BAR_SAMPLES));

    float env = mix(exp(-t), exp(-10.0 * t), 0.7);
    vec2 wave = shotgun(3800.0 * t, 2.0, 0.0, 1.0);
    dest += 0.4 * env * mix(0.5, 1.0, duck) * tanh(8.0 * wave);
  }

  if (barIndex / 8 == 5 || barIndex / 8 == 13) { // snare roll
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
    float noisephase = 128.0 * t;
    vec2 wave = mix(
      mix(
        cis(TAU * (sinphase)),
        cis(TAU * (1.5 * sinphase)),
        0.3
      ),
      cheapnoise(noisephase) - cheapnoise(noisephase - 0.004),
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

    float cutoffKnobWave = sin(timeGlobal) + sin(1.41 * timeGlobal) + sin(1.88 * timeGlobal);
    float cutoffKnob = barIndex < 20 ? 0.3 * smoothstep(14.0, 20.0, bars) :
      barIndex < 48 ? mix(0.3, 0.7 + 0.1 * cutoffKnobWave, smoothstep(40.0, 48.0, bars)) :
      barIndex < 80 ? mix(0.7 + 0.1 * cutoffKnobWave, 0.6, smoothstep(79.0, 80.0, bars)) :
      barIndex < 112 ? mix(0.6, 0.7 + 0.1 * cutoffKnobWave, smoothstep(104.0, 112.0, bars)) :
      barIndex < 129 ? mix(0.7 + 0.1 * cutoffKnobWave, 0.5, smoothstep(127.0, 129.0, bars)) :
      barIndex < 144 ? mix(0.5, 0.3, smoothstep(136.0, 144.0, bars)) :
      0.3;
    float resoKnob = barIndex < 48 ? mix(0.0, 0.9, smoothstep(40.0, 48.0, bars)) :
      barIndex < 129 ? mix(0.9, 0.7, smoothstep(127.0, 129.0, bars)) :
      0.7;
    float dissonanceKnob = barIndex < 88 ? 0.0 : 0.2;

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
    float basefreq = p2f(mix(pitch, pitch1, linearstep(0.0, SLIDE_TIME, t - SLIDE_T0)));
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
  
      vec2 wave = vec2(0.0);
      wave += sin(TAU * phase + filt.y);
      sum += wave * env * coeff * filt.x;
    }
  
    float bias = -0.4;
    dest += 0.25 * mix(0.8, 1.0, duck) * (clip(4.0 * (sum + bias)) - bias);
  }

  fragColor = clip(1.3 * tanh(dest) * smoothstep(152.0, 144.0, bars));
}
