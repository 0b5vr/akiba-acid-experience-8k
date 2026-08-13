#version 300 es

//[
precision highp float;
//]

uniform float t;

in vec2 v;

out vec4 outColor;

const float BPS = 140.0 / 60.0;

// TB-303風のアシッドスクウィグル:
// 鋸波の倍音をカットオフ(cutoff)と共鳴(reso)でフィルタリングするローパス+レゾナンスもどき
float acidWave(float theta, float cutoff, float reso) {
  float sum = 0.0;
  float norm = 0.0;

  for (int i = 1; i <= 8; i++) {
    float n = float(i);
    float pos = n / 8.0;

    float amp = 1.0 / n; // 鋸波の倍音振幅
    float lp = smoothstep(cutoff + 0.12, cutoff - 0.12, pos); // ローパス
    float peak = reso * exp(-pow((pos - cutoff) * 8.0, 2.0)); // レゾナンスピーク

    amp *= lp + peak;

    sum += amp * sin(n * theta);
    norm += amp;
  }

  return sum / max(norm, 0.0001);
}

void main() {
  vec2 p = v;
  p.x *= 16.0 / 9.0;

  float r = length(p);
  float theta = atan(p.y, p.x);

  // フィルターエンベロープLFO: 4拍ごとにカットオフが開いてから閉じていく
  float phase = fract(t * BPS / 4.0);
  float cutoff = 0.12 + 0.8 * pow(1.0 - phase, 2.0);
  float reso = 0.7;

  float wave = acidWave(theta * 5.0 + 2.0 * t, cutoff, reso);

  float ring = 0.45 + 0.18 * wave;
  float d = abs(r - ring);

  vec3 col = vec3(0.0);
  col += smoothstep(0.025, 0.0, d) * vec3(0.3, 1.0, 0.4);
  col += smoothstep(0.12, 0.0, d) * vec3(0.05, 0.35, 0.1);

  outColor = vec4(col, 1.0);
}
