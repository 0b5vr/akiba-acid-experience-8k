#!/usr/bin/env -S deno run --allow-read --allow-write

// context-model-test - pack JavaScript into a self-extracting html + context mixing coder
// v0.1.0

// Copyright (c) 2026 0b5vr
// SPDX-License-Identifier: MIT

// Usage:
// - prepare a js code, which will be fed into `eval`
// - install Deno as your runtime
// - run: `deno run --allow-read --allow-write bin/context-model-test.ts input.js output.html`

// Shoutouts to:
// - lifthrasiir, for Roadroller ... https://github.com/lifthrasiir/roadroller
//   - The context model, the logistic mixer and the rANS coder are all straight ports of it.
//     The difference is how the compressed data is delivered: Roadroller embeds it as a 6-bit
//     JS string literal (which then relies on DEFLATE to shave the unused 2 bits), while this
//     appends it to the html as raw 8-bit bytes and reads it back via `fetch`#`` like compeko.
// - 0b5vr, for compeko ... the self-extracting html header trick

// =================================================================================================

// -- modules --------------------------------------------------------------------------------------
import { relative } from 'https://deno.land/std@0.221.0/path/relative.ts';
import { expandGlob } from 'https://deno.land/std@0.221.0/fs/expand_glob.ts';

// -- params ---------------------------------------------------------------------------------------
// all fixed for now. these are (mostly) the Roadroller defaults

/** the number of bits of each probability. `predictions` is a Uint16Array so this must be <= 16 */
const PRECISION = 16;

/** the adaptation rate saturates at 1/(MODEL_MAX_COUNT + 1/MODEL_RECIP_BASE_COUNT) */
const MODEL_MAX_COUNT = 5;
const MODEL_RECIP_BASE_COUNT = 20;

/**
 * the mixing weights are updated by stretch(p)/RECIP_LEARNING_RATE * (bit - mixed).
 * we mix in base 2 (stretch(p) = log2(p/(1-p)), squash(x) = 1/(1+2^-x)) rather than in base e,
 * because `2**M` is 7 bytes shorter than `Math.exp(M)` in the decoder while `Math.log2` only
 * costs 1. that is exactly equivalent to base e with the rate divided by ln2, so Roadroller's
 * default of 500 corresponds to ~720 here
 */
const RECIP_LEARNING_RATE = 850;

/** log2 of the number of contexts per model. 12 models * 2^22 contexts * 3 bytes = ~151 MB */
const CONTEXT_BITS = 22;

/** each selector is a bitmask of "which of the recent bytes are in this model's context" */
const SPARSE_SELECTORS = [0, 1, 2, 3, 6, 7, 13, 21, 25, 42, 50, 57];

/** track whether we are inside a string literal, and use it as an additional context bit */
const MODEL_QUOTES = true;

// -- constants ------------------------------------------------------------------------------------
/** the number of bits we emit per output byte. Roadroller has to use 6 here, we don't */
const OUT_BITS = 8;

/** this is slightly configurable (ryg_rans equivalent would be 31) but let's not */
const ANS_BITS = 28;

const NUM_MODELS = SPARSE_SELECTORS.length;
const NUM_CONTEXTS = NUM_MODELS << CONTEXT_BITS;
const CONTEXT_MASK = (1 << CONTEXT_BITS) - 1;
const THETA = 1 << (PRECISION + 1);
const DELTA_SHIFT = 29 - PRECISION;
const RENORM_LIMIT = 1 << (ANS_BITS - OUT_BITS);
const OUT_SYMBOLS = 1 << OUT_BITS;

/** how many recent bytes we have to remember, derived from the widest selector */
const NUM_RECENT_BYTES = Math.max(
  ...SPARSE_SELECTORS.map((selector) => {
    let n = 0;
    while (selector >> n > 0) { n++; }
    return n;
  }),
);

// -- utils ----------------------------------------------------------------------------------------
/** returns `${m}e${e}` where (m-1) * 10^e < v <= m * 10^e, m < 100 and m mod 10 != 0 */
function approximateWithTwoSigDigits(v: number): string {
  let exp = 0;
  let tens = 1;
  while (v >= tens * 100) {
    exp++;
    tens *= 10;
  }
  let mant = Math.ceil(v / tens);
  if (mant % 10 === 0) {
    mant /= 10;
    exp++;
  }
  return exp > 1 ? `${mant}e${exp}` : `${mant * 10 ** exp}`;
}

/** emits 2^n, reusing the decoder's `T` (= 2^(PRECISION+1)) whenever that comes out shorter */
function pow2(n: number): string {
  if (n < 10 || n > PRECISION + 10) { return `${2 ** n}`; }
  const d = n - (PRECISION + 1);
  if (d < 0) { return `T/${2 ** -d}`; }
  if (d > 0) { return `T*${2 ** d}`; }
  return 'T';
}

/** emits 1/MODEL_RECIP_BASE_COUNT as a decimal literal if that is shorter than the division */
const MODEL_BASE_COUNT = 1 / MODEL_RECIP_BASE_COUNT === Number((1 / MODEL_RECIP_BASE_COUNT).toPrecision(2))
  ? `${1 / MODEL_RECIP_BASE_COUNT}`.replace(/^0/, '')
  : `1/${MODEL_RECIP_BASE_COUNT}`;

// -- the model ------------------------------------------------------------------------------------
// this is Roadroller's DefaultModel (SparseContextModel[] + LogisticMixModel) flattened into one
// class. the decoder generated below has to behave exactly the same, bit for bit

class Model {
  /** the probability of the next bit being 1, scaled by 2^PRECISION, per (context, model) */
  private predictions = new Uint16Array(NUM_CONTEXTS).fill(1 << (PRECISION - 1));
  /** how many times each (context, model) has been seen, saturating at MODEL_MAX_COUNT */
  private counts = new Uint8Array(NUM_CONTEXTS);
  /** the mixing weight of each model */
  private weights = new Float64Array(NUM_MODELS);
  /** stretch(p) of each model, stashed by `predict` and consumed by `update` */
  private stretched = new Float64Array(NUM_MODELS);
  /** the index into `predictions` of each model, stashed by `predict` */
  private indices = new Int32Array(NUM_MODELS);
  /** the byte-level context hash of each model, updated by `flushByte` */
  private sparseContexts = new Int32Array(NUM_MODELS);
  /** recentBytes[i] is the (i+1)-th last byte */
  private recentBytes = new Uint8Array(NUM_RECENT_BYTES);
  /** `0b1xx..xx` where xx..xx are the bits read so far within the current byte */
  private bitContext = 1;
  /** the quote character we are currently inside of, or 0 */
  private quote = 0;
  /** the mixed probability, scaled by 2^(PRECISION+1), stashed by `predict` */
  private mixedProb = 0;

  /** which quote characters actually appeared, so the decoder can skip the ones that never do */
  public quotesSeen = new Set<number>();

  /** returns the predicted frequency of the next bit being 1, scaled by 2^PRECISION */
  public predict(): number {
    const quoteOffset = this.quote > 0 ? 129 : 0;

    let total = 0;
    for (let i = 0; i < NUM_MODELS; i++) {
      const context = this.sparseContexts[i] + this.bitContext + quoteOffset;
      const index = (context & CONTEXT_MASK) * NUM_MODELS + i;
      this.indices[i] = index;

      const prob = this.predictions[index] * 2 + 1;
      const stretched = Math.log2(prob / (THETA - prob));
      this.stretched[i] = stretched;
      total += this.weights[i] * stretched;
    }

    // squash(total). the `|1` keeps the probability away from exactly 0
    this.mixedProb = (THETA - 1) / (1 + 2 ** -total) | 1;
    return this.mixedProb >> 1;
  }

  public update(bit: number): void {
    const mixed = this.mixedProb / THETA;

    for (let i = 0; i < NUM_MODELS; i++) {
      const index = this.indices[i];

      if (this.counts[index] < MODEL_MAX_COUNT) {
        this.counts[index]++;
      }

      // adjust P by (actual - P) / (count + 1/MODEL_RECIP_BASE_COUNT), in fixed point.
      // Roadroller proves that this stays within int32 and that P stays within [0, 2^PRECISION)
      const delta = ((bit << PRECISION) - this.predictions[index]) << DELTA_SHIFT;
      this.predictions[index] += (delta / (this.counts[index] + 1 / MODEL_RECIP_BASE_COUNT) | 0) >> DELTA_SHIFT;

      this.weights[i] += this.stretched[i] / RECIP_LEARNING_RATE * (bit - mixed);
    }

    this.bitContext = this.bitContext * 2 + bit;
  }

  public flushByte(byte: number): void {
    this.bitContext = 1;

    this.recentBytes.copyWithin(1, 0);
    this.recentBytes[0] = byte;

    for (let i = 0; i < NUM_MODELS; i++) {
      const selector = SPARSE_SELECTORS[i];
      let context = 0;
      for (let j = NUM_RECENT_BYTES - 1; j >= 0; j--) {
        // this can go negative, which is "fixed" by the masking in `predict`
        if (selector >> j & 1) { context = (context + this.recentBytes[j]) * 997 | 0; }
      }
      this.sparseContexts[i] = context;
    }

    if (MODEL_QUOTES) {
      if (this.quote && this.quote === byte) {
        this.quote = 0;
      } else if (!this.quote && (byte === 34 || byte === 39 || byte === 96)) {
        this.quote = byte;
        this.quotesSeen.add(byte);
      }
    }
  }
}

// -- the rANS encoder -----------------------------------------------------------------------------
// roughly based on https://github.com/rygorous/ryg_rans/blob/master/rans_byte.h
// the decoder runs in reverse, so we buffer everything and encode it backwards

function encode(input: Uint8Array, inBits: number, model: Model): {
  state: number;
  buf: number[];
} {
  const bits: { bit: number; prob: number }[] = [];

  for (let offset = 0; offset < input.length; offset++) {
    const code = input[offset];
    for (let i = inBits - 1; i >= 0; i--) {
      const bit = code >> i & 1;
      const prob = model.predict();
      bits.push({ bit, prob });
      model.update(bit);
    }
    model.flushByte(code);
  }

  const probScale = PRECISION + 1;
  const stateShift = ANS_BITS - OUT_BITS - probScale;

  let state = RENORM_LIMIT;
  const buf: number[] = [];

  for (const { bit, prob: predictedFreq } of bits.reverse()) {
    // if PRECISION=2, freq={0,1,2,3} map to prob={1/8,3/8,5/8,7/8}, avoiding exactly 0 or 1
    const prob = (predictedFreq << 1) | 1;

    const start = bit ? 0 : prob;
    const size = bit ? prob : (1 << probScale) - prob;

    // renormalize
    const maxState = size * OUT_SYMBOLS << stateShift;
    while (state >= maxState) {
      buf.push(state % OUT_SYMBOLS);
      state = state / OUT_SYMBOLS | 0;
    }

    state = ((state / size | 0) << probScale) + state % size + start;
    if (state >= 0x80000000) {
      throw new Error('encode: state overflow');
    }
  }

  buf.reverse();
  return { state, buf };
}

// -- the decoder ----------------------------------------------------------------------------------
// generates the JS source of the decoder, as an arrow function taking the whole file and returning
// the original source. it is handed straight to `.then()`, so the compressed bytes arrive as the
// first argument and every other variable is a default-valued parameter. that keeps all of them
// local, out of the `with(document)` scope an event handler attribute otherwise runs in
//
// A: the whole file  T: 2^(PRECISION+1)  W: weights  P: predictions  K: counts  O: decoded bytes
// S: rANS state  R: read position in A, starting right past the header  L: write position in O
// Q: current quote character  N: bit context  M: mixed prediction  a: scratch  b: decoded bit
// E: stretched probs  F: indices

function buildDecoder(
  inputLength: number,
  inBits: number,
  quotesSeen: Set<number>,
  skip: number,
  /** whether to eval the result in place, or hand it back so the verifier can compare it */
  evalResult: boolean,
): string {
  const inMax = 1 << inBits;
  const contextSize = approximateWithTwoSigDigits(NUM_CONTEXTS);
  const quotes = [...quotesSeen].sort((a, b) => a - b);

  // '' for selector 0, '21' for selector 3 (= the 1st and 2nd last bytes), joined by '0'.
  // the decoder splits it back with `.split(0)`, which doubles as the initializer of M
  const selectors = SPARSE_SELECTORS.map((selector) => {
    const offsets = [];
    for (let j = 0; 1 << j <= selector; j++) {
      if (selector >> j & 1) { offsets.push(j + 1); }
    }
    return offsets.reverse().join('');
  }).join('0');

  // after reading one byte: write it out, then update the quote state
  const flushByte = quotes.length > 0
    ? `O[L++]=N-=${inMax},Q=Q?N-Q&&Q:` + (quotes.length > 1
      ? `(${quotes.map((q) => `N==${q}`).join('|')})&&N`
      : `N==${quotes[0]}&&N`)
    : `O[L++]=N-${inMax}`;

  const params = [
    'A',
    `T=1<<${PRECISION + 1}`,
    `W=Array(${NUM_MODELS}).fill(0)`,
    `P=new Uint16Array(${contextSize}).fill(${pow2(PRECISION - 1)})`,
    `K=new Uint8Array(${contextSize})`,
    `O=new Uint8Array(${inputLength})`,
    'S=0',
    `R=${skip}`,
    'L=0',
    ...quotes.length > 0 ? ['Q=0'] : [],
    'N',
    'M',
    'a',
    'b',
    'E',
    'F',
  ].join(',');

  // the three loops below do NOT run in the order they are written:
  // 1. the outer loop reads one byte at a time
  // 2. the middle loop reads one bit at a time; its update expression does the actual decoding
  // 3. the inner loop's init computes the context hashes, and its update renormalizes the state
  const body = `for(;L<${inputLength};${flushByte})` +
    `for(N=1;N<${inMax};` +
      // mix the stretched predictions into M, and stash them (premultiplied by the learning rate)
      `E=F.map((c,i)=>(` +
        `a=P[c]*2+1,` +
        `a=Math.log2(a/(T-a)),` +
        `M-=W[i]*a,` +
        `a/${RECIP_LEARNING_RATE}` +
      `)),` +
      // squash, then pull a single bit out of the rANS state
      `M=~-T/(1+2**M)|1,` +
      `b=S%T<M,` +
      `S=S%T+(b?M:T-M)*(S>>${PRECISION + 1})-!b*M,` +
      // update the predictions, the counts and the weights
      `F.map((c,i)=>(` +
        `P[c]+=(b*${pow2(PRECISION)}-P[c]<<${DELTA_SHIFT})/` +
          `((K[c]+=K[c]<${MODEL_MAX_COUNT})+${MODEL_BASE_COUNT})>>${DELTA_SHIFT},` +
        `W[i]+=E[i]*(b-M/T)` +
      `)),` +
      `N=N*2+b` +
    `)` +
    // hash the recent bytes of each model into an index, then top the state back up
    `for(F='${selectors}'.split(M=0).map((c,i)=>(` +
      `a=0,` +
      `[...c].map(c=>a=a*997+(O[L-c]|0)|0),` +
      `${pow2(CONTEXT_BITS)}-1&a*997+N${quotes.length > 0 ? '+!!Q*129' : ''}` +
    `)*${NUM_MODELS}+i);` +
      `S<${pow2(ANS_BITS - OUT_BITS)};` +
      `S=S*${OUT_SYMBOLS}|A[R++]` +
    `);`;

  // `eval?.()`, not `eval()`: the latter is a direct eval, which would hand the unpacked code this
  // function's scope. its top level `var`s would then land in here -- among A, T, W and the rest of
  // the single letter parameters -- instead of on the global object. the optional call form is
  // specified as an indirect eval, so it runs in the global scope for 4 bytes less than `(0,eval)`
  const tail = evalResult
    ? `eval?.(new TextDecoder().decode(O))`
    : `return new TextDecoder().decode(O)`;

  return `(${params})=>{${body}${tail}}`;
}

// =================================================================================================

// -- sanity check ---------------------------------------------------------------------------------
if (Deno.args.length < 2) {
  console.error('Usage: deno run --allow-read --allow-write context-model-test.ts input.js output.html');
  Deno.exit(1);
}

// -- file stuff -----------------------------------------------------------------------------------
const inputGlob = Deno.args[0];
const inputEntry = await expandGlob(inputGlob).next();
const inputPath = inputEntry?.value?.path;

if (!inputPath) {
  console.error(`\x1b[31mGlob did not match: ${inputGlob}\x1b[0m`);
  Deno.exit(1);
}
const inputPathRelative = relative('.', inputPath);
console.info(`Input file: \x1b[34m${inputPathRelative}\x1b[0m`);

const outputPath = Deno.args[1];
console.info(`Output file: \x1b[34m${outputPath}\x1b[0m`);

// -- main -----------------------------------------------------------------------------------------
const inputText = await Deno.readTextFile(inputPath);
const inputBytes = new TextEncoder().encode(inputText);
const inputSize = inputBytes.length;
console.info(`Input size: \x1b[32m${inputSize.toLocaleString()} bytes\x1b[0m`);

const inBits = inputBytes.every((c) => c <= 0x7f) ? 7 : 8;
console.info(`Compressing the file... (${NUM_MODELS} models, ${CONTEXT_BITS} context bits, ${inBits} bits per symbol)`);

const timeBegin = performance.now();

const model = new Model();
const { state, buf } = encode(inputBytes, inBits, model);

// the initial rANS state goes first, so that the decoder's renormalization loop picks it up
const stateBytes: number[] = [];
for (let st = state; st > 0; st = Math.floor(st / OUT_SYMBOLS)) {
  stateBytes.unshift(st % OUT_SYMBOLS);
}

const data = Uint8Array.from([...stateBytes, ...buf]);

console.info(`Compressed in \x1b[32m${((performance.now() - timeBegin) / 1000).toFixed(1)} s\x1b[0m`);

// -- assemble -------------------------------------------------------------------------------------
// the decoder is handed straight to `.then()`, and starts reading at `skip` so that it walks over
// the header sitting in front of the data. that means the header has to know its own length, which
// only ever grows when the number of digits does, so iterating on it settles after a couple of rounds
const build = (skip: number) => {
  const decoder = buildDecoder(inputSize, inBits, model.quotesSeen, skip, true);
  const header = `<svg onload="fetch\`\`.then(t=>t.bytes()).then(${decoder})">`;
  return { skip, headerBytes: new TextEncoder().encode(header) };
};

let built = build(0);
let converged = false;
for (let i = 0; i < 8 && !converged; i++) {
  const next = build(built.headerBytes.length);
  converged = next.headerBytes.length === built.headerBytes.length;
  built = next;
}

if (!converged) {
  console.error('\x1b[31mThe header length did not converge\x1b[0m');
  Deno.exit(1);
}

const { headerBytes } = built;

// -- output ---------------------------------------------------------------------------------------
const concated = new Uint8Array(headerBytes.length + data.length);
concated.set(headerBytes);
concated.set(data, headerBytes.length);

// -- verify ---------------------------------------------------------------------------------------
// run the generated decoder, fed with the exact bytes the browser is going to hand it: the whole
// output file. this covers both the coder itself and the header offset baked into it. the only
// difference from the shipped one is that this build hands the source back rather than eval'ing it
console.info('Verifying the generated decoder...');

const verifier = buildDecoder(inputSize, inBits, model.quotesSeen, built.skip, false);

// deno-lint-ignore no-eval
const decoded = (0, eval)(verifier)(concated);
if (decoded !== inputText) {
  console.error('\x1b[31mThe decoder did not reproduce the input\x1b[0m');
  Deno.exit(1);
}

const outputSize = concated.length;
const percentage = (100.0 * (outputSize / inputSize)).toFixed(3);
console.info(`Header size: \x1b[32m${headerBytes.length.toLocaleString()} bytes\x1b[0m`);
console.info(`Data size: \x1b[32m${data.length.toLocaleString()} bytes\x1b[0m`);
console.info(`Output size: \x1b[32m${outputSize.toLocaleString()} bytes\x1b[0m (${percentage} %)`);

await Deno.writeFile(outputPath, concated);

console.info('Done \x1b[32m✓\x1b[0m');
