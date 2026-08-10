import type { Sequence } from './Sequence';

/**
 * Validates a sequence of events.
 * It checks that the sequence is sorted by beat.
 */
export function validateSequence<T>(sequence: Sequence<T>): void {
  let lastBeat = -Infinity;
  for (let i = 0; i < sequence.length; i++) {
    const [beat] = sequence[i];
    if (beat < lastBeat) {
      throw new Error(`Sequence is not sorted by beat at #${i} (${beat.toFixed(2)} beat).`);
    }
    lastBeat = beat;
  }
}
