import { green } from 'https://deno.land/std@0.221.0/fmt/colors.ts';

import type { CompressionParams } from './CompressionParams.ts';
import { MAX_MODELS, MIN_MODELS, SELECTOR_LIMIT } from './constants.ts';
import { pack, PackResult } from './pack.ts';
import { cloneCompressionParams } from './utils/cloneCompressionParams.ts';

/**
 * Returns the cursor to the head of the line (`\r`) and erases the whole line (`CSI 2K`), so the
 * next write overwrites the previous line instead of stacking up.
 */
const CLEAR_LINE = '\r\x1b[2K';

const DistMode = {
  EXP: 1,
  LINEAR: 0,
} as const;

type DistMode = typeof DistMode[keyof typeof DistMode];

/**
 * Evaluates each of the given values once, in order.
 *
 * @param values The values to evaluate.
 * @param f The function to evaluate. It should return a Promise that resolves to a number.
 */
async function searchPresets(
  values: number[],
  f: (x: number) => Promise<number>,
): Promise<void> {
  for (const value of values) { await f(value); }
}

/**
 * Minimizes f(x) over integers in [lo, hi] in binary search fashion.
 *
 * @param lo The lower bound of the search range (inclusive).
 * @param hi The upper bound of the search range (inclusive).
 * @param dist The distribution of the search space. EXP is for exponential distributions, LINEAR is for linear distributions.
 * @param f The function to minimize. It should return a Promise that resolves to a number.
 */
async function searchBinary(
  lo: number,
  hi: number,
  dist: DistMode,
  f: (x: number) => Promise<number>,
): Promise<void> {
  const mid = dist === DistMode.EXP
    ? (x: number, y: number) => Math.round(Math.sqrt(x * y))
    : (x: number, y: number) => (x + y) >> 1;

  const cache = new Map<number, number>();
  const evaluate = async (x: number) => {
    let y = cache.get(x);
    if (y === undefined) {
      y = await f(x);
      cache.set(x, y);
    }
    return y;
  };

  let q2 = mid(lo, hi);
  while (hi - lo >= 4) {
    // pick five points in the range and evaluate them
    const xx = [lo, mid(lo, q2), q2, mid(q2, hi), hi];
    const yy: number[] = [];
    for (const x of xx) { yy.push(await evaluate(x)); }

    // find the minimum of the five points
    let min = 0;
    for (let i = 1; i < 5; i++) {
      if (yy[min] > yy[i]) { min = i; }
    }

    // narrow the search range to the three points around the minimum
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
  for (let x = lo + 1; x < hi; x++) { await evaluate(x); }
}

/**
 * Optimizes the compression parameters for a given input.
 * This takes a long time to run depending on the input size and the optimization level.
 *
 * Pretty much a ripoff of Roadroller's implementation.
 *
 * @param input The input Uint8Array to encode.
 * @param inBits The number of bits per input symbol.
 * @param params The compression parameters to start the search from.
 * @param optimizationLevel The optimization level (0-3). Higher levels take longer but may yield better results.
 * @returns The best compression result found, including the parameters and the size of the compressed output.
 */
export async function optimize(
  input: Uint8Array,
  inBits: number,
  base: CompressionParams,
  optimizationLevel: number,
): Promise<PackResult> {
  let bestParams = cloneCompressionParams(base);
  let bestPack = await pack(input, inBits, bestParams).catch(() => null);
  let evaluations = 1;

  let lastPack: PackResult | null = null;

  /**
   * Reports the current progress and the best size so far on the stderr.
   *
   * @param pass The name of the parameter being evaluated.
   * @param progress The progress of the optimization process, used for reporting.
   */
  const report = (pass: string, progress: number) => {
    const bar = `${(100 * progress).toFixed(0)}%`.padStart(4);
    Deno.stderr.writeSync(new TextEncoder().encode(
      `${CLEAR_LINE}  ${pass.padEnd(21)}${bar}  best ${green(`${bestPack?.size.toLocaleString()}`)} (${evaluations} runs)`,
    ));
  };

  /**
   * measures a candidate, keeps it if it wins, and returns its size either way.
   *
   * @param params The compression parameters to evaluate.
   * @param pass The name of the parameter being evaluated.
   * @param progress The progress of the optimization process, used for reporting.
   * @returns The size of the compressed output with the given parameters.
   */
  const consider = async (params: CompressionParams, pass: string, progress: number) => {
    lastPack = await pack(input, inBits, params).catch(() => null);
    evaluations++;

    if ((lastPack?.size ?? Infinity) < (bestPack?.size ?? Infinity)) {
      bestPack = lastPack;
      bestParams = cloneCompressionParams(params);
    }

    report(pass, progress);
    return lastPack?.size ?? Infinity;
  };

  /** picks the search strategy the optimization level asks for */
  const search = (
    lo: number,
    hi: number,
    dist: DistMode,
    presets: number[],
    f: (x: number) => Promise<number>,
  ) => optimizationLevel <= 1 ? searchPresets(presets, f) : searchBinary(lo, hi, dist, f);

  report('starting', 0);

  await search(1, 1000, DistMode.EXP, [10, 20, 50, 100], (i) =>
    consider({ ...bestParams, modelRecipBaseCount: i }, 'modelRecipBaseCount', i / 1000));

  await search(1, 32767, DistMode.EXP, [4, 5, 6], (i) =>
    consider({ ...bestParams, modelMaxCount: i }, 'modelMaxCount', Math.log2(i) / 15));

  for (const useQuoteState of [false, true]) {
    await consider({ ...bestParams, useQuoteState }, 'useQuoteState', useQuoteState ? 1 : 0.5);
  }

  // Optimize sparse selectors by simulated annealing
  {
    let current = [...bestParams.sparseSelectors];
    let currentSize = bestPack?.size ?? Infinity;
    let temperature = 1;
    const targetTemperature = optimizationLevel >= 2 ? 0.1 : 0.9;

    // Let's anneal it
    while (temperature > targetTemperature) {
      const next = [...current];

      // Pick a random selector to add or swap, but make sure we don't add a duplicate
      let added;
      do {
        added = Math.random() * SELECTOR_LIMIT | 0;
      } while (next.includes(added));

      // Mutate the selectors
      const move = Math.random();
      if (move < 0.15) {
        // remove a random selector
        if (next.length > MIN_MODELS) {
          next.splice(Math.random() * next.length | 0, 1);
        }
      } else if (move < 0.3) {
        // add a random selector
        if (next.length < MAX_MODELS) {
          next.push(added);
        }
      } else {
        // swap a random selector with a new one
        next[Math.random() * next.length | 0] = added;
      }

      // sort the selectors
      next.sort((a, b) => a - b);

      // try packing with the new selectors and see if it's better than the current best
      const progress = Math.log(temperature) / Math.log(targetTemperature);
      const size = await consider({ ...bestParams, sparseSelectors: next }, 'sparseSelectors', progress);

      // accept a worse candidate with probability exp(-delta / kT)
      const ANNEAL_K = 6.0;
      if (Math.exp((currentSize - size) / (ANNEAL_K * temperature)) >= Math.random()) {
        current = next;
        currentSize = size;
      }

      temperature *= 0.99;
    }
  }

  // predictions is a Uint16Array, so anything above 16 would not fit
  await search(1, 16, DistMode.LINEAR, [12, 14, 16], (i) =>
    consider({ ...bestParams, precision: i }, 'precision', i / 16));

  await search(1, 99999, DistMode.EXP, [500, 750, 1000, 1250, 1500], (i) =>
    consider({ ...bestParams, recipLearningRate: i }, 'recipLearningRate', Math.log2(i) / 17));

  if (bestPack == null) {
    throw new Error('Unreachable. No valid compression parameters found.');
  }

  Deno.stderr.writeSync(new TextEncoder().encode(CLEAR_LINE));
  return bestPack;
}
