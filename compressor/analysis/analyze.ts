import { originalPositionFor, TraceMap } from 'https://esm.sh/@jridgewell/trace-mapping@0.3.31';

import type { CompressionParams } from '../CompressionParams.ts';
import { Model } from '../model.ts';
import type { AnalyzeSourceResult } from './AnalyzeSourceResult.ts';

/**
 * Walks the text and yields the position of each char.
 */
function* walkInput(text: string): Generator<{
  byteOffset: number;
  byteLength: number;
  line: number;
  column: number;
}> {
  const encoder = new TextEncoder();

  let byteOffset = 0;
  let line = 1;
  let column = 0;

  for (const char of text) {
    const byteLength = encoder.encode(char).length;

    yield { byteOffset, byteLength, line, column };

    byteOffset += byteLength;

    if (char === '\n') {
      // line break!
      line++;
      column = 0;
    } else {
      // `char.length` can be either 1 or 2.
      // This corresponds to the number of UTF-16 code units, which is what the sourcemap uses for column numbers.
      column += char.length;
    }
  }
}

/**
 * Runs the model over the input and returns how many bits the coder spends on each byte.
 * The returning array is the same length as the input and contains the cost of each byte in bits.
 */
function calcByteCosts(input: Uint8Array, inBits: number, params: CompressionParams): Float64Array {
  const model = new Model(params);
  const theta = 1 << (params.precision + 1);
  const costs = new Float64Array(input.length);

  for (let offset = 0; offset < input.length; offset++) {
    const code = input[offset];
    let sumByte = 0;

    // process the input in reverse order, as same as `encode`
    for (let i = inBits - 1; i >= 0; i--) {
      const bit = code >> i & 1;
      const prob = (model.advanceBit(bit) << 1) | 1;
      const size = bit ? prob : theta - prob;
      sumByte += -Math.log2(size / theta);
    }

    model.flushByte(code);
    costs[offset] = sumByte;
  }

  return costs;
}

/**
 * Compresses the input with the given parameters and analyzes how many bits the coder spends on each source file using the sourcemap.
 *
 * @param inputText The input source as a string.
 * @param inBits The number of bits per input symbol.
 * @param params The compression parameters.
 * @param rawSourceMap The parsed sourcemap of the input.
 * @returns The result of each source file, keyed by the source.
 */
export function analyze(
  inputText: string,
  inBits: number,
  params: CompressionParams,
  // deno-lint-ignore no-explicit-any
  rawSourceMap: any,
): Map<string, AnalyzeSourceResult> {
  const input = new TextEncoder().encode(inputText);
  const costs = calcByteCosts(input, inBits, params);
  const traceMap = new TraceMap(rawSourceMap);

  const results = new Map<string, AnalyzeSourceResult>();

  for (const { byteOffset, byteLength, line, column } of walkInput(inputText)) {
    // Calculate the sum of costs for the bytes to this char
    const costBits = costs.subarray(byteOffset, byteOffset + byteLength).reduce((a, b) => a + b, 0);

    // Get the original source for this char from the sourcemap
    const { source } = originalPositionFor(traceMap, { line, column });
    const name = source ?? '(unmapped)';

    // Insert or update the result for this source
    const result = results.get(name) ?? { source: name, rawBytes: 0, costBits: 0, firstOffset: byteOffset };
    result.rawBytes += byteLength;
    result.costBits += costBits;
    results.set(name, result);
  }

  return results;
}
