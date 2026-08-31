import { CompressionParams } from '../CompressionParams.ts';

/**
 * Clones a CompressionParams.
 *
 * Pro tip: This seems to be ~90x faster compared to `structuredClone` and ~20x faster compared to
 * `JSON.parse(JSON.stringify(...))` on JSBenchmark.
 */
export function cloneCompressionParams(params: CompressionParams): CompressionParams {
  return {
    ...params,
    sparseSelectors: [...params.sparseSelectors],
  };
}
