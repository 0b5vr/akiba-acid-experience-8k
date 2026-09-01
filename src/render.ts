import { GL_FRAMEBUFFER, GL_TRIANGLE_STRIP } from './gl-constants';
import { BPM } from './constants';
import { DUMP_SCENES, ENABLE_SEEKING, INTRO_LENGTH, START_DELAY, STOP_RENDERING_AFTER_END, STOP_RENDERING_BEFORE_START } from './config';
import { audio } from './audio';
import { updateTextureText } from './textures/textureText';
import { framebufferScene, textureScene } from './textures/textureScene';
import { gl } from './gl';
import { seekBeginTime } from './music';
import { programs } from './programs/programs';
import { sequences } from './sequence/sequences';
import { evalSequence } from './sequence/evalSequence';
import { renderDumpScenes } from './renderDumpScenes';
import { renderPass, preparePass } from './renderPass';

import './programs/loadPrograms';
import './sequence/buildSequences';

/**
 * Renders the main scene.
 */
export function render(): void {
  const time = ENABLE_SEEKING
    ? audio.currentTime - seekBeginTime
    : audio.currentTime - START_DELAY;

  if (DUMP_SCENES) {
    renderDumpScenes(time);
    return;
  }

  // prevent using a GPU before the content starts
  if (STOP_RENDERING_BEFORE_START) {
    if (time < 0) { return; }
  }

  // prevent using a GPU after the content ends
  if (STOP_RENDERING_AFTER_END) {
    if (time > INTRO_LENGTH) { return; }
  }

  const beat = time * BPM / 60.0;

  // -- update text texture ------------------------------------------------------------------------
  updateTextureText(evalSequence(sequences.text, beat)!);

  // -- scene + overlay pass -----------------------------------------------------------------------
  gl.bindFramebuffer(GL_FRAMEBUFFER, framebufferScene);

  renderPass(evalSequence(sequences.scene, beat)!, time);
  renderPass(evalSequence(sequences.overlay, beat)!, time);

  // -- post process pass --------------------------------------------------------------------------
  gl.bindFramebuffer(GL_FRAMEBUFFER, null);

  preparePass(programs.post, time, textureScene);

  // TODO: optimize these uniform names later
  gl.uniform1f(
    gl.getUniformLocation(programs.post, 'zoom'),
    evalSequence(sequences.zoom, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programs.post, 'shake'),
    evalSequence(sequences.shake, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programs.post, 'tile'),
    evalSequence(sequences.tile, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programs.post, 'kaleidoscope'),
    evalSequence(sequences.kaleidoscope, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programs.post, 'codercolor'),
    evalSequence(sequences.codercolor, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programs.post, 'posterize'),
    evalSequence(sequences.posterize, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programs.post, 'chougouyoku'),
    evalSequence(sequences.chougouyoku, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programs.post, 'white'),
    evalSequence(sequences.white, beat)!,
  );

  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
}
