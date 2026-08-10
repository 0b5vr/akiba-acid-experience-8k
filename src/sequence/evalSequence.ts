import type { Sequence } from './Sequence';

/**
 * Evaluates a sequence at a given beat and returns the corresponding value.
 *
 * It performs a linear search through the sequence, which is not efficient for large sequences.
 * We might want to consider using a binary search or other optimized methods for larger sequences.
 *
 * @param sequence The sequence to evaluate.
 * @param beat The beat at which to evaluate the sequence.
 * @returns The value of the sequence at the given beat.
 */
export function evalSequence<T>(sequence: Sequence<T>, beat: number): T | undefined {
  let value: T | undefined = undefined;

  for (const [eventBeat, action] of sequence) {
    if (eventBeat > beat) { break; }
    value = action(beat - eventBeat);
  }

  return value;
}
