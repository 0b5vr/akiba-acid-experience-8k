import { AnalyzeOrder } from './AnalyzeOrder.ts';
import type { AnalyzeSourceResult } from './AnalyzeSourceResult.ts';

const comparators: Record<AnalyzeOrder, (a: AnalyzeSourceResult, b: AnalyzeSourceResult) => number> = {
  [AnalyzeOrder.Size]: (a, b) => b.costBits - a.costBits,
  [AnalyzeOrder.Appearance]: (a, b) => a.firstOffset - b.firstOffset,
  [AnalyzeOrder.Name]: (a, b) => a.source.localeCompare(b.source),
};

/**
 * Sorts the results of {@link analyze} in the given order.
 *
 * @param results The results to sort.
 * @param order The order to sort the results in.
 * @returns A new sorted array.
 */
export function sortAnalyzeSourceResults(
  results: Map<string, AnalyzeSourceResult>,
  order: AnalyzeOrder,
): AnalyzeSourceResult[] {
  return [...results.values()].sort(comparators[order]);
}
