/**
 * The analysis result for a single source file, as reported by {@link analyze}.
 */
export interface AnalyzeSourceResult {
  /**
   * The source file identifier, as reported by the sourcemap.
   * It is usually a path relative to the project root.
   */
  source: string;

  /** Bytes of the input attributed to this source. */
  rawBytes: number;

  /** Bits the coder spends on those bytes. */
  costBits: number;

  /** The byte offset this source first appears at, used by the `appearance` order. */
  firstOffset: number;
}
