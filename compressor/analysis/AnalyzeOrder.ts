/** The available values for the `--analyze-sort` argument. */
export const AnalyzeOrder = {
  Name: 'name',
  Size: 'size',
  Appearance: 'appearance',
} as const;

export type AnalyzeOrder = typeof AnalyzeOrder[keyof typeof AnalyzeOrder];
