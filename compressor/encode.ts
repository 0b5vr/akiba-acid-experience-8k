import type { CompressionParams } from './CompressionParams.ts';
import { ANS_BITS, OUT_BITS, OUT_SYMBOLS, RENORM_LIMIT } from './constants.ts';
import { Model } from './model.ts';

/**
 * The rANS encoder state returned by {@link encode}.
 */
export interface EncoderState {
  state: number;
  buf: number[];
  quotesSeen: Set<number>;
}

/**
 * Encodes an input into a rANS-encoded state, which can be decoded by {@link buildDecoder}.
 *
 * Pretty much a ripoff of Roadroller's implementation.
 *
 * @param input The input Uint8Array to encode.
 * @param inBits The number of bits per input symbol.
 * @param params The compression parameters.
 * @returns The rANS-encoded state.
 */
export function encode(input: Uint8Array, inBits: number, params: CompressionParams): EncoderState {
  const model = new Model(params);
  const totalBits = input.length * inBits;
  const bitValues = new Uint8Array(totalBits);
  const bitProbs = new Uint16Array(totalBits);

  // Build the model and record the bit values and probabilities
  for (let offset = 0, at = 0; offset < input.length; offset++) {
    const code = input[offset];
    for (let i = inBits - 1; i >= 0; i--) {
      const bit = code >> i & 1;
      bitValues[at] = bit;
      bitProbs[at] = model.advanceBit(bit);
      at++;
    }
    model.flushByte(code);
  }

  const probScale = params.precision + 1;
  const theta = 1 << probScale;
  const stateShift = ANS_BITS - OUT_BITS - probScale;

  let state = RENORM_LIMIT;
  const buf: number[] = [];

  // Since rANS is a LIFO encoder, we need to process the input in reverse order
  for (let at = totalBits - 1; at >= 0; at--) {
    const bit = bitValues[at];
    const prob = (bitProbs[at] << 1) | 1; // it can never be either 0 or theta

    const start = bit ? 0 : prob;
    const size = bit ? prob : theta - prob;

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
export function stateBytes(state: number): number[] {
  const bytes: number[] = [];
  for (let st = state; st > 0; st = Math.floor(st / OUT_SYMBOLS)) {
    bytes.unshift(st % OUT_SYMBOLS);
  }
  return bytes;
}
