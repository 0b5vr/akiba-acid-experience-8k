import { fmix32, saturate } from '@0b5vr/experimental';
import { programs } from '../programs/programs';
import { sequences } from './sequences';
import { validateSequence } from './validateSequence';
import { easeInSharp, easeOutSharp } from '../utils/easings';

import '../programs/loadPrograms';
import { postSequences } from './postSequences';

sequences.scene = [
  [0, () => programs.iceplanes],
  [64, () => programs.lattice],
  [96, () => programs.logSmiley],
  [128, () => programs.ifsTunnel],
  [160, () => programs.aepchecker],
  [192, (b) => [
    programs.chain,
    programs.funnel,
    programs.cubetunnel,
    programs.plasma,
  ][(b * 2 | 0) % 4]],
  [256, (b) => [
    programs.logSmiley,
    programs.boxTown,
    programs.ifsTunnel,
    programs.swirl,
  ][(b * 2 | 0) % 4]],
  [320, (b) => [
    programs.lattice,
    programs.cubetunnel,
  ][(b | 0) % 2]],
  [320 + 32, () => programs.foldarc],
  [384, (b) => [
    programs.funnel,
    programs.checkersky,
  ][(b | 0) % 2]],
  [384 + 32, () => programs.plasma],
  [448, (b) => [
    programs.foldarc,
    programs.julia,
    programs.logSmiley,
    programs.checkersky,
  ][(b * 2 | 0) % 4]],
  [512, (b) => [
    programs.chain,
    programs.boxTown,
    programs.lattice,
    programs.ifsTunnel,
  ][(b / 4 | 0) % 4]],
  [512 + 32, () => programs.cubetunnel],
  [576, () => programs.checkersky],
];

sequences.overlay = [
  [0, () => programs.text],
  [64, () => programs.textscroll],
  [128, () => programs.aep3d],
  [160, () => programs.smiley7010],
  [192, (b) => [
    programs.smiley3d,
    programs.crab,
    programs.smiley3d,
    programs.text,
  ][(b | 0) % 4]],
  [256, (b) => [
    programs.smiley3d,
    programs.aep3d,
    programs.smiley3d,
    programs.smiley7010,
  ][(b | 0) % 4]],
  [320, () => programs.morph3d],
  [320 + 32, () => programs.smiley7010],
  [384 + 32, () => programs.crab],
  [448, (b) => [
    programs.smiley3d,
    programs.crab,
    programs.aep3d,
  ][(b | 0) % 3]],
  [512, () => programs.textscroll],
  [512 + 32, () => programs.smiley3d],
  [576, () => programs.aep3d],
];

sequences.text = [
  [0, (b) => [
    'AKIBA',
    'EXECUTABLE',
    'PARTY',
    '2026',
    'AKIBA',
    'SHADER',
    'SQUAD',
    'PRESENTS',
    'AKIBA',
    'ACID',
    'EXPERIENCE',
    '8K',
  ][(b | 0) % 12]],
  [192, (b) => [
    'ACID',
    'PARTY',
    'SHADER',
    'TECHNO',
    'DANCE',
  ][(b | 0) % 5]],
  [512, (b) => [
    '0B5VR',
    'GAM0022',
    'KINANKOMOTI',
    'RENARD',
    'SHIVADUKE',
    'SOMA_ARC',
  ][(b | 0) % 5]],
];

if (import.meta.hot) {
  postSequences.splice(0, postSequences.length);
}

postSequences.push(
  [ // zoom
    [0, (b) => 1.0 - 0.9 * easeOutSharp(b / 64.0, 2.0)],
    [64, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
    [128 + 32, (b) => 0.1 + 0.9 * easeInSharp(b / 16.0, 5.0)],
    [192, () => 0.2],
    [320, () => 0.1],
    [448, () => 0.2],
    [512, () => 0.1],
    [576, (b) => 0.1 + 0.9 * easeInSharp(b / 16.0, 5.0)],
  ],
  [ // skake
    [0, () => 0.0],
    [64, (b) => 0.4 * Math.exp(-10.0 * (b % 1.0))],
    [128 + 32, () => 0.0],
    [192, (b) => Math.exp(-10.0 * (b % 1.0))],
    [320, (b) => 0.4 * Math.exp(-10.0 * (b % 1.0))],
    [384 + 32, () => 0.0],
    [448, (b) => Math.exp(-10.0 * (b % 1.0))],
    [512, (b) => 0.4 * Math.exp(-10.0 * (b % 1.0))],
    [576, () => 0.0],
  ],
  [ // tile
    [0, () => 1.0],
    [192, (b) => (
      [
        2,
        4,
        1 + easeOutSharp(b * 2 % 1, 2.0) * 8,
        9 - easeOutSharp(b * 2 % 1, 2.0) * 8,
      ][fmix32(fmix32(1) ^ b * 2) % 11] | 0
    ) || 1],
    [320, () => 1.0],
    [448, (b) => (
      [
        2,
        4,
        1 + easeOutSharp(b * 2 % 1, 2.0) * 8,
        9 - easeOutSharp(b * 2 % 1, 2.0) * 8,
      ][fmix32(fmix32(1) ^ b * 2) % 11] | 0
    ) || 1],
    [512, () => 1.0],
  ],
  [ // kaleidoscope
    [0, () => 0.0],
    [192, (b) => (
      [
        2,
        6,
        8,
        2 + easeOutSharp(b * 2 % 1, 2.0) * 14,
      ][fmix32(fmix32(2) ^ b * 2) % 23] | 0
    ) || 0],
    [320, () => 0.0],
    [448, (b) => (
      [
        2,
        6,
        8,
        2 + easeOutSharp(b * 2 % 1, 2.0) * 14,
      ][fmix32(fmix32(2) ^ b * 2) % 23] | 0
    ) || 0],
    [512, () => 0.0],
  ],
  [ // codercolor
    [0, (b) => 1.0 - easeInSharp(b / 64.0, 2.0)],
    [64, () => 0.0],
    [448, (b) => (fmix32(fmix32(3) ^ b * 2) % 16) < 1 ? 1 : 0],
    [512, () => 0.0],
  ],
  [ // posterize
    [0, () => 0.0],
    [320 + 32, (b) => saturate(2.0 * b)],
    [384 + 32, (b) => 1.0 - easeInSharp(b / 32.0, 2.0)],
    [448, (b) => (fmix32(fmix32(4) ^ b * 2) % 4) < 1 ? 1 : 0],
    [512, () => 0.0],
  ],
  [ // black / white
    [0, (b) => -1.0 + easeOutSharp(b / 64.0, 2.0)],
    [128 + 32, (b) => (b % 0.25) < 0.125 ? b / 64.0 : 0.0],
    [192, () => 0.0],
    [384 + 32, (b) => (b % 0.25) < 0.125 ? b / 64.0 : 0.0],
    [448, () => 0.0],
    [576, (b) => -easeInSharp(b / 32.0, 2.0)],
  ],
  [ // feedback
    [0, (b) => 0.4 - 0.4 * easeOutSharp(b / 64.0, 2.0)],
    [128 + 32 + 16, (b) => 0.8 * easeInSharp(b / 16.0, 4.0)],
    [192, () => 0.0],
    [384 + 32 + 16, (b) => 0.8 * easeInSharp(b / 16.0, 4.0)],
    [448, (b) => (b % 1 > 0.5 && (fmix32(fmix32(5) ^ b) % 4) < 1) ? 0.5 : 0],
    [512, () => 0.0],
    [576, (b) => 0.4 * easeInSharp(b / 24.0, 2.0)],
    [576 + 24, (b) => 0.4 - 0.4 / 8.0 * b],
  ],
  [ // flowInvert
    [0, (b) => 0.8 * easeInSharp(b / 64.0, 2.0)],
    [64, () => 0.0],
    [128 + 32 + 16, (b) => 0.2 * easeInSharp(b / 16.0, 4.0)],
    [192, () => 0.0],
    [384 + 32 + 16, (b) => 0.2 * easeInSharp(b / 16.0, 4.0)],
    [448, (b) => (b % 1 > 0.5 && (fmix32(fmix32(6) ^ b) % 4) < 1) ? 0.9 : 0],
    [512, () => 0.0],
    [576, (b) => 0.4 * easeInSharp(b / 24.0, 2.0)],
    [576 + 24, (b) => 0.4 - 0.4 / 8.0 * b],
  ],
);

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  validateSequence(sequences.scene);
  validateSequence(sequences.overlay);
  validateSequence(sequences.text);

  postSequences.map((sequence) => validateSequence(sequence));

  import.meta.hot.accept();
}
