import { saturate } from './saturate';

export function easeInSharp(x: number, k: number): number {
  return saturate(x) ** k;
}

export function easeOutSharp(x: number, k: number): number {
  return 1.0 - easeInSharp(1.0 - x, k);
}
