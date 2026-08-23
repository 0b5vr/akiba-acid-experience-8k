#!/usr/bin/env -S deno run --allow-read --allow-write

// context-model-test - pack JavaScript into a self-extracting html + context mixing coder
// v0.2.0

// Copyright (c) 2026 0b5vr
// SPDX-License-Identifier: MIT

// Usage:
// - prepare a js code, which will be fed into `eval`
// - install Deno as your runtime
// - run: `deno run --allow-read --allow-write bin/context-model-test.ts input.js output.html`
// - add `-O1` for a quick parameter search, or `-O2` for a thorough one. the search prints the
//   flags to replicate its result, so a build script can pin them and skip the search

// Shoutouts to:
// - lifthrasiir, for Roadroller ... https://github.com/lifthrasiir/roadroller
//   - The context model, the logistic mixer, the rANS coder and the parameter search are all
//     ports of it. The difference is how the compressed data is delivered: Roadroller embeds it
//     as a 6-bit JS string literal (which then relies on DEFLATE to shave the unused 2 bits),
//     while this appends it to the html as raw 8-bit bytes and reads it back via `fetch``` .
// - 0b5vr, for compeko ... the self-extracting html header trick

// =================================================================================================

// -- modules --------------------------------------------------------------------------------------
import { relative } from 'https://deno.land/std@0.221.0/path/relative.ts';
import { expandGlob } from 'https://deno.land/std@0.221.0/fs/expand_glob.ts';

// -- params ---------------------------------------------------------------------------------------
interface Params {
  /** the number of bits of each probability. `predictions` is a Uint16Array so this must be <= 16 */
  precision: number;
  /** the adaptation rate saturates at 1/(modelMaxCount + 1/modelRecipBaseCount) */
  modelMaxCount: number;
  modelRecipBaseCount: number;
  /**
   * the mixing weights are updated by stretch(p)/recipLearningRate * (bit - mixed).
   * we mix in base 2 (stretch(p) = log2(p/(1-p)), squash(x) = 1/(1+2^-x)) rather than in base e,
   * because `2**M` is 7 bytes shorter than `Math.exp(M)` in the decoder while `Math.log2` only
   * costs 1. that is exactly equivalent to base e with the rate divided by ln2, so Roadroller's
   * default of 500 corresponds to ~720 here
   */
  recipLearningRate: number;
  /** log2 of the number of contexts per model. 12 models * 2^22 contexts * 3 bytes = ~151 MB */
  contextBits: number;
  /** each selector is a bitmask of "which of the recent bytes are in this model's context" */
  sparseSelectors: number[];
  /** track whether we are inside a string literal, and use it as an additional context bit */
  modelQuotes: boolean;
}

const DEFAULT_PARAMS: Params = {
  precision: 16,
  modelMaxCount: 5,
  modelRecipBaseCount: 20,
  recipLearningRate: 850,
  contextBits: 22,
  sparseSelectors: [0, 1, 2, 3, 6, 7, 13, 21, 25, 42, 50, 57],
  modelQuotes: true,
};

// -- constants ------------------------------------------------------------------------------------
/** the number of bits we emit per output byte. Roadroller has to use 6 here, we don't */
const OUT_BITS = 8;

/** this is slightly configurable (ryg_rans equivalent would be 31) but let's not */
const ANS_BITS = 28;

const OUT_SYMBOLS = 1 << OUT_BITS;
const RENORM_LIMIT = 1 << (ANS_BITS - OUT_BITS);

/** the search never picks a selector wider than this, to keep the decoder's digits single */
const SELECTOR_LIMIT = 512;

/** how many models the search is allowed to settle on */
const MIN_MODELS = 4;
const MAX_MODELS = 24;

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

/** emits 2^n, reusing the decoder's `T` (= 2^(precision+1)) whenever that comes out shorter */
function pow2(n: number, precision: number): string {
  if (n < 10 || n > precision + 10) { return `${2 ** n}`; }
  const d = n - (precision + 1);
  if (d < 0) { return `T/${2 ** -d}`; }
  if (d > 0) { return `T*${2 ** d}`; }
  return 'T';
}

/** emits 1/recipBaseCount as a decimal literal if that is shorter than the division */
function baseCountLiteral(recipBaseCount: number): string {
  const v = 1 / recipBaseCount;
  const short = `${v}`.replace(/^0/, '');
  return Number(short) === v && short.length <= `1/${recipBaseCount}`.length
    ? short
    : `1/${recipBaseCount}`;
}

/** how many recent bytes we have to remember, derived from the widest selector */
function numRecentBytes(sparseSelectors: number[]): number {
  return Math.max(...sparseSelectors.map((selector) => {
    let n = 0;
    while (selector >> n > 0) { n++; }
    return n;
  }));
}

// -- the array pool -------------------------------------------------------------------------------
// the search runs the coder hundreds of times, and each run wants a fresh ~150 MB pair of arrays.
// allocating those every time buries us in GC, so keep one pair per size around and refill it

// only the most recent size is kept: the search varies the model count, and holding on to every
// size it tries would add up to gigabytes

let pooled: { size: number; predictions: Uint16Array; counts: Uint8Array } | null = null;

function acquireTables(numContexts: number, fillWith: number) {
  if (pooled?.size !== numContexts) {
    pooled = {
      size: numContexts,
      predictions: new Uint16Array(numContexts),
      counts: new Uint8Array(numContexts),
    };
  }
  pooled.predictions.fill(fillWith);
  pooled.counts.fill(0);
  return pooled;
}

// -- the model ------------------------------------------------------------------------------------
// this is Roadroller's DefaultModel (SparseContextModel[] + LogisticMixModel) flattened into one
// class. the decoder generated below has to behave exactly the same, bit for bit

class Model {
  private readonly numModels: number;
  private readonly contextMask: number;
  private readonly theta: number;
  private readonly deltaShift: number;
  private readonly baseCount: number;

  /** the probability of the next bit being 1, scaled by 2^precision, per (context, model) */
  private readonly predictions: Uint16Array;
  /** how many times each (context, model) has been seen, saturating at modelMaxCount */
  private readonly counts: Uint8Array;
  /** the mixing weight of each model */
  private readonly weights: Float64Array;
  /** stretch(p) of each model, stashed by `predict` and consumed by `update` */
  private readonly stretched: Float64Array;
  /** the index into `predictions` of each model, stashed by `predict` */
  private readonly indices: Int32Array;
  /** the byte-level context hash of each model, updated by `flushByte` */
  private readonly sparseContexts: Int32Array;
  /** recentBytes[i] is the (i+1)-th last byte */
  private readonly recentBytes: Uint8Array;

  /** `0b1xx..xx` where xx..xx are the bits read so far within the current byte */
  private bitContext = 1;
  /** the quote character we are currently inside of, or 0 */
  private quote = 0;
  /** the mixed probability, scaled by 2^(precision+1), stashed by `predict` */
  private mixedProb = 0;

  /** which quote characters actually appeared, so the decoder can skip the ones that never do */
  public quotesSeen = new Set<number>();

  constructor(private readonly params: Params) {
    this.numModels = params.sparseSelectors.length;
    this.contextMask = (1 << params.contextBits) - 1;
    this.theta = 1 << (params.precision + 1);
    this.deltaShift = 29 - params.precision;
    this.baseCount = 1 / params.modelRecipBaseCount;

    const tables = acquireTables(this.numModels << params.contextBits, 1 << (params.precision - 1));
    this.predictions = tables.predictions;
    this.counts = tables.counts;

    this.weights = new Float64Array(this.numModels);
    this.stretched = new Float64Array(this.numModels);
    this.indices = new Int32Array(this.numModels);
    this.sparseContexts = new Int32Array(this.numModels);
    this.recentBytes = new Uint8Array(numRecentBytes(params.sparseSelectors));
  }

  /** returns the predicted frequency of the next bit being 1, scaled by 2^precision */
  public predict(): number {
    const quoteOffset = this.quote > 0 ? 129 : 0;

    let total = 0;
    for (let i = 0; i < this.numModels; i++) {
      const context = this.sparseContexts[i] + this.bitContext + quoteOffset;
      const index = (context & this.contextMask) * this.numModels + i;
      this.indices[i] = index;

      const prob = this.predictions[index] * 2 + 1;
      const stretched = Math.log2(prob / (this.theta - prob));
      this.stretched[i] = stretched;
      total += this.weights[i] * stretched;
    }

    // squash(total). the `|1` keeps the probability away from exactly 0
    this.mixedProb = (this.theta - 1) / (1 + 2 ** -total) | 1;
    return this.mixedProb >> 1;
  }

  public update(bit: number): void {
    const { precision, modelMaxCount, recipLearningRate } = this.params;
    const mixed = this.mixedProb / this.theta;

    for (let i = 0; i < this.numModels; i++) {
      const index = this.indices[i];

      if (this.counts[index] < modelMaxCount) {
        this.counts[index]++;
      }

      // adjust P by (actual - P) / (count + 1/modelRecipBaseCount), in fixed point.
      // Roadroller proves that this stays within int32 and that P stays within [0, 2^precision)
      const delta = ((bit << precision) - this.predictions[index]) << this.deltaShift;
      this.predictions[index] += (delta / (this.counts[index] + this.baseCount) | 0) >> this.deltaShift;

      this.weights[i] += this.stretched[i] / recipLearningRate * (bit - mixed);
    }

    this.bitContext = this.bitContext * 2 + bit;
  }

  public flushByte(byte: number): void {
    const { sparseSelectors, modelQuotes } = this.params;

    this.bitContext = 1;

    this.recentBytes.copyWithin(1, 0);
    this.recentBytes[0] = byte;

    for (let i = 0; i < this.numModels; i++) {
      const selector = sparseSelectors[i];
      let context = 0;
      for (let j = this.recentBytes.length - 1; j >= 0; j--) {
        // this can go negative, which is "fixed" by the masking in `predict`
        if (selector >> j & 1) { context = (context + this.recentBytes[j]) * 997 | 0; }
      }
      this.sparseContexts[i] = context;
    }

    if (modelQuotes) {
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

interface Encoded {
  /** the initial rANS state, which the decoder picks up through its renormalization loop */
  state: number;
  buf: number[];
  quotesSeen: Set<number>;
}

function encode(input: Uint8Array, inBits: number, params: Params): Encoded {
  const model = new Model(params);
  const total = input.length * inBits;
  const bitValues = new Uint8Array(total);
  const bitProbs = new Uint16Array(total);

  for (let offset = 0, at = 0; offset < input.length; offset++) {
    const code = input[offset];
    for (let i = inBits - 1; i >= 0; i--) {
      const bit = code >> i & 1;
      bitValues[at] = bit;
      bitProbs[at] = model.predict();
      at++;
      model.update(bit);
    }
    model.flushByte(code);
  }

  const probScale = params.precision + 1;
  const stateShift = ANS_BITS - OUT_BITS - probScale;

  let state = RENORM_LIMIT;
  const buf: number[] = [];

  for (let at = total - 1; at >= 0; at--) {
    const bit = bitValues[at];
    // if precision=2, freq={0,1,2,3} map to prob={1/8,3/8,5/8,7/8}, avoiding exactly 0 or 1
    const prob = (bitProbs[at] << 1) | 1;

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
  return { state, buf, quotesSeen: model.quotesSeen };
}

/** splits the initial state into the bytes the decoder reads before anything else */
function stateBytes(state: number): number[] {
  const bytes: number[] = [];
  for (let st = state; st > 0; st = Math.floor(st / OUT_SYMBOLS)) {
    bytes.unshift(st % OUT_SYMBOLS);
  }
  return bytes;
}

// -- the decoder ----------------------------------------------------------------------------------
// generates the JS source of the decoder, as an arrow function taking the whole file and returning
// the original source. it is handed straight to `.then()`, so the compressed bytes arrive as the
// first argument and every other variable is a default-valued parameter. that keeps all of them
// local, out of the `with(document)` scope an event handler attribute otherwise runs in
//
// A: the whole file  T: 2^(precision+1)  W: weights  P: predictions  K: counts  O: decoded bytes
// S: rANS state  R: read position in A, starting right past the header  L: write position in O
// Q: current quote character  N: bit context  M: mixed prediction  a: scratch  b: decoded bit
// E: stretched probs  F: indices

function buildDecoder(
  params: Params,
  inputLength: number,
  inBits: number,
  quotesSeen: Set<number>,
  skip: number,
  /** whether to eval the result in place, or hand it back so the verifier can compare it */
  evalResult: boolean,
): string {
  const { precision, modelMaxCount, modelRecipBaseCount, recipLearningRate, contextBits } = params;
  const numModels = params.sparseSelectors.length;
  const deltaShift = 29 - precision;
  const inMax = 1 << inBits;
  const contextSize = approximateWithTwoSigDigits(numModels << contextBits);
  const quotes = [...quotesSeen].sort((a, b) => a - b);

  // '' for selector 0, '21' for selector 3 (= the 1st and 2nd last bytes), joined by '0'.
  // the decoder splits it back with `.split(0)`, which doubles as the initializer of M
  const selectors = params.sparseSelectors.map((selector) => {
    const offsets = [];
    for (let j = 0; 1 << j <= selector; j++) {
      if (selector >> j & 1) { offsets.push(j + 1); }
    }
    return offsets.reverse().join('');
  }).join('0');

  // after reading one byte: write it out, then update the quote state.
  // with a single quote character the state is just "in or out", so it toggles -- and being 0 or 1
  // already, it can scale the context offset directly instead of going through `!!Q`
  const flushByte = quotes.length === 1
    ? `O[L++]=N-=${inMax},Q^=N==${quotes[0]}`
    : quotes.length > 1
    ? `O[L++]=N-=${inMax},Q=Q?N-Q&&Q:(${quotes.map((q) => `N==${q}`).join('|')})&&N`
    : `O[L++]=N-${inMax}`;

  const quoteOffset = quotes.length === 1 ? '+Q*129' : quotes.length > 1 ? '+!!Q*129' : '';

  const args = [
    'A',
    `T=1<<${precision + 1}`,
    `W=Array(${numModels}).fill(0)`,
    `P=new Uint16Array(${contextSize}).fill(${pow2(precision - 1, precision)})`,
    // aliasing the constructor pays for itself from the second use on
    'U=Uint8Array',
    `K=new U(${contextSize})`,
    `O=new U(${inputLength})`,
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
        `a/${recipLearningRate}` +
      `)),` +
      // squash, then pull a single bit out of the rANS state
      `M=~-T/(1+2**M)|1,` +
      `b=S%T<M,` +
      `S=S%T+(b?M:T-M)*(S>>${precision + 1})-!b*M,` +
      // update the predictions, the counts and the weights
      `F.map((c,i)=>(` +
        `P[c]+=(b*${pow2(precision, precision)}-P[c]<<${deltaShift})/` +
          `((K[c]+=K[c]<${modelMaxCount})+${baseCountLiteral(modelRecipBaseCount)})>>${deltaShift},` +
        `W[i]+=E[i]*(b-M/T)` +
      `)),` +
      `N=N*2+b` +
    `)` +
    // hash the recent bytes of each model into an index, then top the state back up
    `for(F='${selectors}'.split(M=0).map((c,i)=>(` +
      `a=0,` +
      `[...c].map(c=>a=a*997+(O[L-c]|0)|0),` +
      `${pow2(contextBits, precision)}-1&a*997+N${quoteOffset}` +
    `)*${numModels}+i);` +
      `S<${pow2(ANS_BITS - OUT_BITS, precision)};` +
      `S=S*${OUT_SYMBOLS}|A[R++]` +
    `);`;

  // `eval?.()`, not `eval()`: the latter is a direct eval, which would hand the unpacked code this
  // function's scope. its top level `var`s would then land in here -- among A, T, W and the rest of
  // the single letter parameters -- instead of on the global object. the optional call form is
  // specified as an indirect eval, so it runs in the global scope for 4 bytes less than `(0,eval)`
  // spreading into fromCharCode is shorter, but the argument count is what limits it -- engines
  // start throwing somewhere past 2^16, so hand anything near that to TextDecoder instead.
  // it also only reads right when every byte is a codepoint, i.e. when the input was 7-bit
  const stringify = inBits === 7 && inputLength < 65000
    ? `String.fromCharCode(...O)`
    : `new TextDecoder().decode(O)`;

  const tail = evalResult ? `eval?.(${stringify})` : `return ${stringify}`;

  return `(${args})=>{${body}${tail}}`;
}

// -- packing --------------------------------------------------------------------------------------

interface Packed {
  headerBytes: Uint8Array;
  data: Uint8Array;
  /** the read offset baked into the decoder, which the verifier has to match */
  skip: number;
  size: number;
}

function pack(input: Uint8Array, inBits: number, params: Params): Packed {
  const { state, buf, quotesSeen } = encode(input, inBits, params);
  const data = Uint8Array.from([...stateBytes(state), ...buf]);

  // the decoder is handed straight to `.then()`, and starts reading at `skip` so that it walks over
  // the header sitting in front of the data. that means the header has to know its own length,
  // which only grows when the number of digits does, so iterating on it settles in a few rounds
  const build = (skip: number) => {
    const decoder = buildDecoder(params, input.length, inBits, quotesSeen, skip, true);
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
    throw new Error('pack: the header length did not converge');
  }

  return {
    headerBytes: built.headerBytes,
    data,
    skip: built.skip,
    size: built.headerBytes.length + data.length,
  };
}

// -- the parameter search -------------------------------------------------------------------------
// ported from Roadroller's Packer.optimize. the difference is that we can measure the real output
// size directly, where Roadroller has to estimate what DEFLATE will do to its first line.
//
// contextBits is deliberately left out, the same as in Roadroller. more bits means fewer hash
// collisions and therefore a smaller output, always -- so a search would just walk to whatever
// ceiling we gave it and quietly triple the memory the viewer needs. it is a budget, not a
// tuning knob, so it stays at whatever the caller asked for (`-Zcb`)

const EXP = 1;
const LINEAR = 0;

/**
 * minimizes f(x) over integers in [lo, hi], assuming a single global minimum. we know nothing about
 * f'(x), so this is a binary search that picks five points and assumes the smallest is the closest
 */
function search(
  lo: number,
  hi: number,
  dist: number,
  manualValues: number[],
  level: number,
  score: (x: number) => number,
): void {
  if (level <= 1) {
    for (const value of manualValues) { score(value); }
    return;
  }

  const mid = dist === EXP
    ? (x: number, y: number) => Math.round(Math.sqrt(x * y))
    : (x: number, y: number) => (x + y) >> 1;

  const cache = new Map<number, number>();
  const evaluate = (x: number) => {
    let y = cache.get(x);
    if (y === undefined) {
      y = score(x);
      cache.set(x, y);
    }
    return y;
  };

  let q2 = mid(lo, hi);
  while (hi - lo >= 4) {
    const xx = [lo, mid(lo, q2), q2, mid(q2, hi), hi];
    const yy = xx.map(evaluate);

    let min = 0;
    for (let i = 1; i < 5; i++) {
      if (yy[min] > yy[i]) { min = i; }
    }

    if (min === 0) {
      hi = xx[1];
      q2 = mid(lo, hi);
    } else if (min === 4) {
      lo = xx[3];
      q2 = mid(lo, hi);
    } else {
      lo = xx[min - 1];
      q2 = xx[min];
      hi = xx[min + 1];
    }
  }

  // make sure everything left in the final range has been evaluated
  for (let x = lo + 1; x < hi; x++) { evaluate(x); }
}

function optimize(
  input: Uint8Array,
  inBits: number,
  base: Params,
  level: number,
): { params: Params; size: number } {
  const clone = (p: Params): Params => ({ ...p, sparseSelectors: [...p.sparseSelectors] });

  let best = clone(base);
  let bestSize = pack(input, inBits, best).size;
  let evaluations = 1;

  const report = (pass: string, ratio: number) => {
    const bar = `${(100 * ratio).toFixed(0)}%`.padStart(4);
    Deno.stderr.writeSync(new TextEncoder().encode(
      `\r\x1b[2K  ${pass.padEnd(21)}${bar}  best \x1b[32m${bestSize.toLocaleString()}\x1b[0m` +
      ` (${evaluations} runs)`,
    ));
  };

  /** measures a candidate, keeps it if it wins, and returns its size either way */
  const consider = (params: Params, pass: string, ratio: number) => {
    const size = pack(input, inBits, params).size;
    evaluations++;
    if (size < bestSize) {
      bestSize = size;
      best = clone(params);
    }
    report(pass, ratio);
    return size;
  };

  report('starting', 0);

  search(1, 1000, EXP, [10, 20, 50, 100], level, (i) =>
    consider({ ...best, modelRecipBaseCount: i }, 'modelRecipBaseCount', i / 1000));

  search(1, 32767, EXP, [4, 5, 6], level, (i) =>
    consider({ ...best, modelMaxCount: i }, 'modelMaxCount', Math.log2(i) / 15));

  for (const modelQuotes of [false, true]) {
    consider({ ...best, modelQuotes }, 'modelQuotes', modelQuotes ? 1 : 0.5);
  }

  // sparse selectors, by simulated annealing. replacing one selector at a time and accepting the
  // occasional loss is what lets this crawl out of the local minimum the defaults sit in
  {
    let current = [...best.sparseSelectors];
    let currentSize = bestSize;
    let temperature = 1;
    const target = level >= 2 ? 0.1 : 0.9;

    while (temperature > target) {
      const next = [...current];
      let added;
      do {
        added = Math.random() * SELECTOR_LIMIT | 0;
      } while (next.includes(added));

      // as well as swapping a selector out, the search may drop or add one. fewer models means a
      // shorter selector string in the decoder, more means better predictions -- and since what we
      // measure is the whole file, the two sides of that trade are weighed against each other
      const move = Math.random();
      if (move < 0.15 && next.length > MIN_MODELS) {
        next.splice(Math.random() * next.length | 0, 1);
      } else if (move < 0.3 && next.length < MAX_MODELS) {
        next.push(added);
      } else {
        next[Math.random() * next.length | 0] = added;
      }
      next.sort((a, b) => a - b);

      const ratio = Math.log(temperature) / Math.log(target);
      const size = consider({ ...best, sparseSelectors: next }, 'sparseSelectors', ratio);

      // accept a worse candidate with probability exp(-delta / kT)
      if (Math.exp((currentSize - size) / (6 * temperature)) >= Math.random()) {
        current = next;
        currentSize = size;
      }

      temperature *= 0.99;
    }
  }

  // predictions is a Uint16Array, so anything above 16 would not fit
  search(1, 16, LINEAR, [12, 14, 16], level, (i) =>
    consider({ ...best, precision: i }, 'precision', i / 16));

  search(1, 99999, EXP, [500, 750, 1000, 1250, 1500], level, (i) =>
    consider({ ...best, recipLearningRate: i }, 'recipLearningRate', Math.log2(i) / 17));

  Deno.stderr.writeSync(new TextEncoder().encode('\r\x1b[2K'));
  return { params: best, size: bestSize };
}

/** the flags that reproduce a given set of parameters, for pinning a search result */
function replicateFlags(params: Params): string {
  return [
    `-Zdy${params.modelQuotes ? 1 : 0}`,
    `-Zlr${params.recipLearningRate}`,
    `-Zmc${params.modelMaxCount}`,
    `-Zmd${params.modelRecipBaseCount}`,
    `-Zpr${params.precision}`,
    `-Zcb${params.contextBits}`,
    `-S${params.sparseSelectors.join(',')}`,
  ].join(' ');
}

// =================================================================================================

// -- arguments ------------------------------------------------------------------------------------
const USAGE = 'Usage: deno run --allow-read --allow-write context-model-test.ts ' +
  '[-O<level>] [-Z<param><value>] [-S<selectors>] input.js output.html';

const params: Params = { ...DEFAULT_PARAMS, sparseSelectors: [...DEFAULT_PARAMS.sparseSelectors] };
const positional: string[] = [];
let level = 0;

for (const arg of Deno.args) {
  const flag = arg.match(/^-(O|Zdy|Zlr|Zmc|Zmd|Zpr|Zcb|S)(.+)$/);
  if (!flag) {
    positional.push(arg);
    continue;
  }

  const [, name, value] = flag;
  if (name === 'S') {
    params.sparseSelectors = value.split(',').map(Number).sort((a, b) => a - b);
  } else if (name === 'O') {
    level = Number(value);
  } else if (name === 'Zdy') {
    params.modelQuotes = value !== '0';
  } else if (name === 'Zlr') {
    params.recipLearningRate = Number(value);
  } else if (name === 'Zmc') {
    params.modelMaxCount = Number(value);
  } else if (name === 'Zmd') {
    params.modelRecipBaseCount = Number(value);
  } else if (name === 'Zpr') {
    params.precision = Number(value);
  } else if (name === 'Zcb') {
    params.contextBits = Number(value);
  }
}

if (positional.length < 2) {
  console.error(USAGE);
  Deno.exit(1);
}

if (params.sparseSelectors.some((s) => !(s >= 0 && s < SELECTOR_LIMIT))) {
  console.error(`\x1b[31mSelectors must be within 0..${SELECTOR_LIMIT - 1}\x1b[0m`);
  Deno.exit(1);
}

if (!(params.precision >= 1 && params.precision <= 16)) {
  console.error('\x1b[31mPrecision must be within 1..16\x1b[0m');
  Deno.exit(1);
}

// -- file stuff -----------------------------------------------------------------------------------
const inputGlob = positional[0];
const inputEntry = await expandGlob(inputGlob).next();
const inputPath = inputEntry?.value?.path;

if (!inputPath) {
  console.error(`\x1b[31mGlob did not match: ${inputGlob}\x1b[0m`);
  Deno.exit(1);
}
const inputPathRelative = relative('.', inputPath);
console.info(`Input file: \x1b[34m${inputPathRelative}\x1b[0m`);

const outputPath = positional[1];
console.info(`Output file: \x1b[34m${outputPath}\x1b[0m`);

// -- main -----------------------------------------------------------------------------------------
const inputText = await Deno.readTextFile(inputPath);
const inputBytes = new TextEncoder().encode(inputText);
const inputSize = inputBytes.length;
console.info(`Input size: \x1b[32m${inputSize.toLocaleString()} bytes\x1b[0m`);

const inBits = inputBytes.every((c) => c <= 0x7f) ? 7 : 8;

const timeBegin = performance.now();

let chosen = params;
if (level > 0) {
  console.info(`Searching for parameters (-O${level})...`);
  const result = optimize(inputBytes, inBits, params, level);
  chosen = result.params;
  const elapsed = ((performance.now() - timeBegin) / 1000).toFixed(1);
  console.info(`Search done in \x1b[32m${elapsed} s\x1b[0m, use \x1b[34m${replicateFlags(chosen)}\x1b[0m to replicate`);
}

console.info(
  `Compressing the file... ` +
    `(${chosen.sparseSelectors.length} models, ${chosen.contextBits} context bits, ${inBits} bits per symbol)`,
);

const packed = pack(inputBytes, inBits, chosen);

// -- output ---------------------------------------------------------------------------------------
const concated = new Uint8Array(packed.size);
concated.set(packed.headerBytes);
concated.set(packed.data, packed.headerBytes.length);

// -- verify ---------------------------------------------------------------------------------------
// run the generated decoder, fed with the exact bytes the browser is going to hand it: the whole
// output file. this covers both the coder itself and the header offset baked into it. the only
// difference from the shipped one is that this build hands the source back rather than eval'ing it
console.info('Verifying the generated decoder...');

const { quotesSeen } = encode(inputBytes, inBits, chosen);
const verifier = buildDecoder(chosen, inputSize, inBits, quotesSeen, packed.skip, false);

// deno-lint-ignore no-eval
const decoded = (0, eval)(verifier)(concated);
if (decoded !== inputText) {
  console.error('\x1b[31mThe decoder did not reproduce the input\x1b[0m');
  Deno.exit(1);
}

const percentage = (100.0 * (packed.size / inputSize)).toFixed(3);
console.info(`Header size: \x1b[32m${packed.headerBytes.length.toLocaleString()} bytes\x1b[0m`);
console.info(`Data size: \x1b[32m${packed.data.length.toLocaleString()} bytes\x1b[0m`);
console.info(`Output size: \x1b[32m${packed.size.toLocaleString()} bytes\x1b[0m (${percentage} %)`);

await Deno.writeFile(outputPath, concated);

console.info('Done \x1b[32m✓\x1b[0m');
