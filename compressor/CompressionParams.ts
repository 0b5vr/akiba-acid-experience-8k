export interface CompressionParams {
  /**
   * the number of bits of each probability.
   * `predictions` is a Uint16Array so this must be <= 16.
   */
  precision: number;

  /** the adaptation rate saturates at 1 / (modelMaxCount + 1 / modelRecipBaseCount). */
  modelMaxCount: number;

  /** the adaptation rate saturates at 1 / (modelMaxCount + 1 / modelRecipBaseCount). */
  modelRecipBaseCount: number;

  /**
   * the mixing weights are updated by stretch(p) / recipLearningRate * (bit - mixed).
   * We use base 2 logarithm for stretch(p), so the learning rate is in log2 space as well.
   */
  recipLearningRate: number;

  /** log2 of the number of contexts per model. 12 models * 2^22 contexts * 3 bytes = ~151 MB */
  contextBits: number;

  /**
   * The bitmasks of sparse selectors.
   * 0 means no recent bytes, 1 means the last byte, 2 means the second last byte, 3 means both, ...
   */
  sparseSelectors: number[];

  /**
   * track whether we are inside a string literal, and use it as an additional context bit.
   * Seems it helps with JS codes, but hurts with plain text.
   */
  useQuoteState: boolean;
}

export const DEFAULT_PARAMS: CompressionParams = {
  precision: 16,
  modelMaxCount: 5,
  modelRecipBaseCount: 20,
  recipLearningRate: 850,
  contextBits: 22,
  sparseSelectors: [0, 1, 2, 3, 6, 7, 13, 21, 25, 42, 50, 57],
  useQuoteState: true,
};
