import { programs } from '../programs/programs';
import { sequences } from './sequences';

import '../programs/loadPrograms';
import { validateSequence } from './validateSequence';
import { easeOutSharp } from '../utils/easings';

const aep3d = () => programs.aep3d;
const box = () => programs.box;
const boxarray = () => programs.boxarray;
const checkersky = () => programs.checkersky;
const crab = () => programs.crab;
const cubetunnel = () => programs.cubetunnel;
const dotmatrix = () => programs.dotmatrix;
const foldarc = () => programs.foldarc;
const lattice = () => programs.lattice;
const noiseaura = () => programs.noiseaura;
const nop = () => programs.nop;
const plasma = () => programs.plasma;
const smiley = () => programs.smiley;
const smiley3d = () => programs.smiley3d;
const text = () => programs.text;

sequences.scene = [
  [0, box],
  [4, lattice],
  [8, checkersky],
  [12, lattice],
  [16, boxarray],
  [64, cubetunnel],
  [128, lattice],
  [192, plasma],
  [193, dotmatrix],
  [268, foldarc], // bar 64, ride out
  [352, dotmatrix], // bar 88, breakdown
  [384, foldarc], // bar 96, snare back in
  [448, lattice], // bar 112, full arrangement back
];

sequences.overlay = [
  [0, text],
  [32, nop],
  [64, smiley],
  [96, noiseaura],
  [160, crab],
  [192, smiley3d],
  [196, aep3d],
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
  [196, (t) => Math.exp(-10.0 * t)],
  [197, (t) => Math.exp(-10.0 * t)],
  [198, (t) => Math.exp(-10.0 * t)],
  [199, (t) => Math.exp(-10.0 * t)],
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
  [192, (t) => t < 0.1 ? 1.0 : 0.0],
  [193, (t) => t < 0.1 ? 1.0 : 0.0],
  [194, (t) => t < 0.1 ? 1.0 : 0.0],
  [195, (t) => t < 0.1 ? 1.0 : 0.0],
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
