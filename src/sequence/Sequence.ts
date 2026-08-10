export type SequenceEvent<T> = [beat: number, action: (elapsedBeat: number) => T];

export type Sequence<T> = SequenceEvent<T>[];
