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
    programs.iceplanes,
    programs.cubetunnel,
    programs.plasma,
  ][(b * 2 | 0) % 4]],
  [256, (b) => [
    programs.logSmiley,
    programs.boxTown,
    programs.julia,
    programs.ifsTunnel,
  ][(b * 2 | 0) % 4]],
  [320, (b) => [
    programs.lattice,
    programs.cubetunnel,
  ][(b | 0) % 2]],
  [320 + 32, () => programs.foldarc],
];

sequences.overlay = [
  [0, () => programs.text],
  [64, () => programs.textscroll],
  [128, () => programs.aep3d],
  [160, () => programs.smiley7010],
  [192, (b) => [
    programs.smiley3d,
    programs.aep3d,
    programs.morph3d,
  ][(b | 0) % 3]],
  [320, () => programs.smiley7010],
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
];

if (import.meta.hot) {
  postSequences.splice(0, postSequences.length);
}

postSequences.push(
  [ // zoom
    [0, (b) => 1.0 - 0.9 * easeOutSharp(b / 64.0, 2.0)],
    [64, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
    [192, () => 0.2],
  ],
  [ // skake
    [0, () => 0.0],
    [64, (b) => 0.4 * Math.exp(-10.0 * (b % 1.0))],
    [192 - 32, () => 0.0],
    [192, (b) => Math.exp(-10.0 * (b % 1.0))],
    [320, (b) => 0.4 * Math.exp(-10.0 * (b % 1.0))],
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
  ],
  [ // codercolor
    [0, () => 0.0],
    [192, (b) => (fmix32(fmix32(3) ^ b * 2) % 16) < 1 ? 1 : 0],
    [320, () => 0.0],
  ],
  [ // posterize
    [0, () => 0.0],
    [320 + 32, (b) => saturate(2.0 * b)],
  ],
  [ // black / white
    [0, (b) => -1.0 + easeOutSharp(b / 16.0, 2.0)],
    [160, (b) => (b % 0.25) < 0.125 ? b / 64.0 : 0.0],
    [192, () => 0.0],
  ],
  [ // feedback
    [0, (b) => 0.5 - 0.5 * easeOutSharp(b / 64.0, 2.0)],
    [160 + 16, (b) => easeInSharp(b / 16.0, 4.0)],
    [192, () => 0.0],
    // [192, (b) => (b % 1 > 0.5 && (fmix32(fmix32(5) ^ b) % 4) < 1) ? 0.5 : 0],
    [320, () => 0.0],
  ],
  [ // flowInvert
    [0, (b) => 0.8 * easeInSharp(b / 64.0, 4.0)],
    [64, () => 0.0],
    [160 + 16, (b) => easeInSharp(b / 16.0, 4.0)],
    [192, (b) => (b % 1 > 0.5 && (fmix32(fmix32(6) ^ b) % 4) < 1) ? 0.9 : 0],
    [320, () => 0.0],
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
