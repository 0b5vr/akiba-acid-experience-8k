import { programs } from '../programs/programs';
import { sequences } from './sequences';

import '../programs/loadPrograms';
import { validateSequence } from './validateSequence';
import { easeOutSharp } from '../utils/easings';

const box = () => programs.box;
const boxarray = () => programs.boxarray;
const checkersky = () => programs.checkersky;
const crab = () => programs.crab;
const cubetunnel = () => programs.cubetunnel;
const lattice = () => programs.lattice;
const noiseaura = () => programs.noiseaura;
const nop = () => programs.nop;
const smiley = () => programs.smiley;
const text = () => programs.text;

sequences.scene = [
  [0, box],
  [4, lattice],
  [8, checkersky],
  [12, lattice],
  [16, boxarray],
  [64, cubetunnel],
  [128, lattice],
  [192, (b) => [
    programs.lattice,
    programs.foldarc,
    programs.dotmatrix,
    programs.plasma,
  ][~~(b * 2) % 4]],
];

sequences.overlay = [
  [0, text],
  [32, nop],
  [64, smiley],
  [96, noiseaura],
  [160, crab],
  [192, (b) => [
    programs.smiley3d,
    programs.aep3d,
    programs.smiley3d,
    programs.crab,
  ][~~(b) % 4]],
];

sequences.text = [
  [0, () => 'AKIBA'],
  [1, () => 'EXECUTABLE'],
  [2, () => 'PARTY'],
  [3, () => '2026'],
];

sequences.zoom = [
  [0, () => 0.0],
  [4, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
  [8, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
  [12, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
  [16, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
];

sequences.shake = [
  [0, () => 0.0],
  [192, (b) => Math.exp(-10.0 * (b % 1.0))],
];

sequences.tile = [
  [0, () => 1.0],
  [160, () => 4.0],
  [192, () => 1.0],
];

sequences.kaleidoscope = [
  [0, () => 0.0],
  [12, () => 6.0],
  [16, () => 0.0],
  [160, () => 8.0],
  [192, () => 0.0],
];

sequences.codercolor = [
  [0, () => 0.0],
  [128, () => 1.0],
  [192, () => 0.0],
];

sequences.chougouyoku = [
  [0, () => 0.0],
  [160, () => 1.0],
  [192, () => 0.0],
];

sequences.white = [
  [0, () => 0.0],
  // [192, (b) => (b % 1.0) < 0.1 ? 1.0 : 0.0],
];

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  validateSequence(sequences.scene);
  validateSequence(sequences.overlay);
  validateSequence(sequences.text);
  validateSequence(sequences.zoom);
  validateSequence(sequences.shake);
  validateSequence(sequences.tile);
  validateSequence(sequences.kaleidoscope);
  validateSequence(sequences.codercolor);
  validateSequence(sequences.chougouyoku);
  validateSequence(sequences.white);

  import.meta.hot.accept();
}
