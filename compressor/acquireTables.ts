let pooled: { size: number; predictions: Uint16Array; counts: Uint16Array } | null = null;

/**
 * Acquires a predictions and counts table of the given size, reusing a previously allocated one if
 * possible, otherwise our GC will scream in pain.
 *
 * @param numContexts The number of contexts to allocate.
 * @param fillWith The value to fill the predictions table with.
 * @returns An object containing the predictions and counts tables.
 */
export function acquireTables(numContexts: number, fillWith: number) {
  if (pooled?.size !== numContexts) {
    pooled = {
      size: numContexts,
      predictions: new Uint16Array(numContexts),
      counts: new Uint16Array(numContexts),
    };
  }
  pooled.predictions.fill(fillWith);
  pooled.counts.fill(0);
  return pooled;
}
