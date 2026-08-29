import { GL_COLOR_BUFFER_BIT, GL_FRAMEBUFFER, GL_TRIANGLE_STRIP } from './gl-constants';
import { BPM, HEIGHT, WIDTH } from './constants';
import { updateTextureText } from './textures/textureText';
import { gl } from './gl';
import { programs } from './programs/programs';
import { sequences } from './sequence/sequences';
import { evalSequence } from './sequence/evalSequence';
import { preparePass } from './renderPass';

const DUMP_SCENE_KEYS = [
  'aep3d',
  'box',
  'boxarray',
  'checkersky',
  'crab',
  'cubetunnel',
  'dotmatrix',
  'foldarc',
  'lattice',
  'noiseaura',
  'plasma',
  'smiley',
  'smiley3d',
  'swirl',
  'text',
] as const satisfies (keyof typeof programs)[];

/**
 * Renders every scene (including overlays) to the screen in a grid layout.
 * Used when {@link DUMP_SCENES} is `true`, for showcasing the scenes in development.
 */
export function renderDumpScenes(time: number): void {
  const beat = time * BPM / 60.0;

  updateTextureText(evalSequence(sequences.text, beat)!);

  const cols = Math.ceil(Math.sqrt(DUMP_SCENE_KEYS.length));
  const rows = cols;
  const cellWidth = Math.floor(WIDTH / cols);
  const cellHeight = Math.floor(HEIGHT / rows);

  gl.bindFramebuffer(GL_FRAMEBUFFER, null);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(GL_COLOR_BUFFER_BIT);

  for (const [i, key] of DUMP_SCENE_KEYS.entries()) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    preparePass(programs[key], time);

    // has to come after `preparePass`, which resets the viewport to the full size
    gl.viewport(
      col * cellWidth,
      HEIGHT - (row + 1) * cellHeight,
      cellWidth,
      cellHeight,
    );

    gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
  }
}
