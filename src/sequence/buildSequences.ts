import { programs } from '../programs/programs';
import { sequences } from './sequences';

import '../programs/loadPrograms';
import { validateSequence } from './validateSequence';
import { easeOutSharp } from '../utils/easings';

const box = () => programs.box;
const lattice = () => programs.lattice;
const boxarray = () => programs.boxarray;

sequences.scene = [
  [0, box],
  [4, lattice],
  [8, box],
  [12, lattice],
  [16, boxarray],
  [128, lattice],
];

sequences.zoom = [
  [0, () => 0.1],
  [4, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
  [8, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
  [12, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
  [16, (b) => 0.5 - 0.4 * easeOutSharp(b / 4.0, 4.0)],
];

sequences.kaleidoscope = [
  [0, () => 0.0],
  [12, () => 6.0],
  [16, () => 0.0],
  [128, () => 8.0],
];

sequences.codercolor = [
  [0, () => 0.0],
  [128, () => 1.0],
];

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  validateSequence(sequences.scene);
  validateSequence(sequences.zoom);
  validateSequence(sequences.kaleidoscope);
  validateSequence(sequences.codercolor);

  import.meta.hot.accept();
}
