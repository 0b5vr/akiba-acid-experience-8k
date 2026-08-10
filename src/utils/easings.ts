import { saturate } from '@0b5vr/experimental';

export function easeInSharp(x: number, k: number): number {
  return saturate(x ** k);
}

export function easeOutSharp(x: number, k: number): number {
  return 1.0 - easeInSharp(1.0 - x, k);
}

export function easeIn(x: number, k: number): number {
  x = saturate(x);
  return (k + 1.0) * (x ** k) - k * (x ** (k + 1.0));
}

export function easeOut(x: number, k: number): number {
  return 1.0 - easeIn(1.0 - x, k);
}
