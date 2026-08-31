import type { CompressionParams } from './CompressionParams.ts';
import { acquireTables } from './acquireTables.ts';

/** How many recent bytes we have to remember, derived from the widest selector. */
export function numRecentBytes(selectors: number[]): number {
  return Math.max(...selectors.map((selector) => {
    let n = 0;
    while (selector >> n > 0) { n++; }
    return n;
  }));
}

/**
 * Prepares the selectors for each model by converting each selector's bitmask into an array
 * of offsets.
 */
function prepareSelectors(selectors: number[]): number[][] {
  return selectors.map((selector) => {
    const offsets = [];
    for (let j = 0; 1 << j <= selector; j++) {
      if (selector >> j & 1) { offsets.push(j + 1); }
    }
    return offsets;
  });
}

/**
 * The context mixing model used by {@link encode}.
 *
 * Pretty much a ripoff of Roadroller's implementation.
 */
export class Model {
  /** The number of models. Same as `params.sparseSelectors.length` */
  private readonly numModels: number;

  /**
   * The context mask, used to wrap the context hash into the size of {@link predictions}.
   * Derived from {@link CompressionParams.contextBits}.
   */
  private readonly contextMask: number;

  /** 2^(precision+1) */
  private readonly theta: number;

  /** The number of bits to shift when updating the {@link predictions}. */
  private readonly deltaShift: number;

  /** The reciprocal of {@link CompressionParams.modelRecipBaseCount}. */
  private readonly baseCount: number;

  /**
   * The probability of the next bit being 1, scaled by 2^precision, per (context, model).
   * The size should be {@link numModels} * 2^contextBits.
   */
  private readonly predictions: Uint16Array;

  /**
   * How many times each (context, model) has been seen, saturating at modelMaxCount.
   * The size should be {@link numModels} * 2^contextBits.
   */
  private readonly counts: Uint16Array;

  /**
   * The mixing weight of each model.
   * The size should be {@link numModels}.
   */
  private readonly weights: Float64Array;

  /**
   * stretch(p) of each model, stashed by the first pass of {@link advanceBit} and consumed by the second.
   * The size should be {@link numModels}.
   */
  private readonly stretched: Float64Array;

  /**
   * The index into {@link predictions} of each model.
   * Won't be used outside of {@link advanceBit}.
   * The size should be {@link numModels}.
   */
  private readonly tempIndices: Int32Array;

  /**
   * The context hash of each model, updated by {@link flushByte} and used by {@link advanceBit}.
   */
  private readonly contexts: Int32Array;

  /**
   * (i+1)-th last byte.
   * The size should be {@link numRecentBytes}.
   */
  private readonly recentBytes: Uint8Array;

  /**
   * The list of recentBytes offsets for each model.
   * Derived from {@link CompressionParams.sparseSelectors} in the constructor.
   */
  private readonly preparedSelectors: number[][];

  /** `0b1xx..xx` where xx..xx are the bits read so far within the current byte */
  private bitContext = 1;

  /** The quote charcode we are currently inside of, or 0 if outside. */
  private quote = 0;

  /** Set of quote charcodes actually appeared so far. */
  public quotesSeen = new Set<number>();

  constructor(private readonly params: CompressionParams) {
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
    this.tempIndices = new Int32Array(this.numModels);
    this.contexts = new Int32Array(this.numModels);
    this.preparedSelectors = prepareSelectors(params.sparseSelectors);
    this.recentBytes = new Uint8Array(numRecentBytes(params.sparseSelectors));
  }

  /**
   * Predicts the next bit, then updates the model with the actual bit.
   * Updates the predictions and model weights + advances the bit context.
   *
   * @param actualBit The actual bit.
   * @returns The predicted frequency of the bit being 1, scaled by 2^precision.
   */
  public advanceBit(actualBit: number): number {
    const { precision, modelMaxCount, recipLearningRate } = this.params;
    const quoteOffset = this.quote > 0 ? 129 : 0;

    // predict the next bit
    let weightedSum = 0;
    for (let i = 0; i < this.numModels; i++) {
      // compute the actual index into predictions and counts for this model,
      // based on the model's context hash, the bit context, and the quote state
      const context = this.contexts[i] + this.bitContext + quoteOffset;
      const index = (context & this.contextMask) * this.numModels + i;
      this.tempIndices[i] = index;

      // compute the stretched prediction for this model and add it to the total
      const prob = this.predictions[index] * 2 + 1; // it can never be either 0 or theta
      const stretched = Math.log2(prob / (this.theta - prob));
      this.stretched[i] = stretched;
      weightedSum += this.weights[i] * stretched;
    }

    // squash the weighted sum into a probability
    const mixedProb = (this.theta - 1) / (1 + 2 ** -weightedSum) | 1;
    const mixed = mixedProb / this.theta;

    // update each model with the actual bit
    for (let i = 0; i < this.numModels; i++) {
      const index = this.tempIndices[i];

      // increment the count, saturating at modelMaxCount
      if (this.counts[index] < modelMaxCount) {
        this.counts[index]++;
      }

      // update the prediction using the actual bit
      const delta = ((actualBit << precision) - this.predictions[index]) << this.deltaShift;
      this.predictions[index] += (delta / (this.counts[index] + this.baseCount) | 0) >> this.deltaShift;

      // update the weight of the model using the stretched prediction and the learning rate
      this.weights[i] += this.stretched[i] / recipLearningRate * (actualBit - mixed);
    }

    // advance the bit context for the next bit
    this.bitContext = this.bitContext * 2 + actualBit;

    // return the prediction, will be used to update the rANS state
    return mixedProb >> 1;
  }

  /**
   * Advances the per-byte state.
   * Resets the bit context and calculates the context hash for each model.
   */
  public flushByte(byte: number): void {
    const { useQuoteState } = this.params;

    // reset the bit context for the new byte
    this.bitContext = 1;

    // shift the recent-bytes window and push the new byte to the front
    this.recentBytes.copyWithin(1, 0);
    this.recentBytes[0] = byte;

    // for each model, hash its selected recent bytes into a context
    for (let i = 0; i < this.numModels; i++) {
      const selector = this.preparedSelectors[i];
      let context = 0;

      // for each offset in the selector, hash the recent bytes into a context
      // 997 is a magic number borrowed from Roadroller
      for (let j = 0; j < selector.length; j++) {
        const offset = selector[j];
        context = ~(~this.recentBytes[offset - 1] + context) * 997;
      }
      this.contexts[i] = context;
    }

    if (useQuoteState) {
      if (this.quote && this.quote === byte) {
        // found the closing quote, so we're no longer inside a quote
        this.quote = 0;
      } else if (!this.quote && (byte === 34 || byte === 39 || byte === 96)) {
        // found an opening quote, so we're now inside a quote
        this.quote = byte;
        this.quotesSeen.add(byte);
      }
    }
  }
}
