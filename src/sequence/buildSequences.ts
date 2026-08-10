import { programs } from '../programs/programs';
import { sequences } from './sequences';

import '../programs/loadPrograms';
import { validateSequence } from './validateSequence';
import { easeOut } from '../utils/easings';

const box = () => programs.box;
const lattice = () => programs.lattice;

sequences.scene = [
  [0, box],
  [16, lattice],
  [32, box],
  [48, lattice],
];

sequences.zoom = [
  [0, () => 0.1],
  [16, (b) => 0.1 + 0.4 * easeOut(b, 4.0)],
  [32, () => 0.1],
];

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  validateSequence(sequences.scene);
  validateSequence(sequences.zoom);

  import.meta.hot.accept();
}
