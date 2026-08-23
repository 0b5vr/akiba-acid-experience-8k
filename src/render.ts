import { GL_FRAMEBUFFER, GL_TEXTURE0, GL_TEXTURE1, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from './gl-constants';
import { BPM, HEIGHT, WIDTH } from './constants';
import { DUMP_SCENES, ENABLE_SEEKING, INTRO_LENGTH, START_DELAY, STOP_RENDERING_AFTER_END, STOP_RENDERING_BEFORE_START } from './config';
import { audio } from './audio';
import { textureFbm } from './textures/textureFbm';
import { textureText, updateTextureText } from './textures/textureText';
import { framebufferScene, textureScene } from './textures/textureScene';
import { gl } from './gl';
import { seekBeginTime } from './music';
import { programs } from './programs/programs';
import { sequences } from './sequence/sequences';
import { evalSequence } from './sequence/evalSequence';
import { renderDumpScenes } from './renderDumpScenes';

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

  // -- scene pass ---------------------------------------------------------------------------------
  let program = evalSequence(sequences.scene, beat)!;

  gl.useProgram(program);

  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, textureFbm);

  gl.activeTexture(GL_TEXTURE1);
  gl.bindTexture(GL_TEXTURE_2D, textureText);

  gl.uniform1f(
    gl.getUniformLocation(program, 't'),
    time,
  );
  gl.uniform1i(
    gl.getUniformLocation(program, 'f'),
    0,
  );
  gl.uniform1i(
    gl.getUniformLocation(program, 'g'),
    1,
  );

  gl.bindFramebuffer(GL_FRAMEBUFFER, framebufferScene);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);

  // -- overlay pass ---------------------------------------------------------------------------------
  program = evalSequence(sequences.overlay, beat)!;

  gl.useProgram(program);

  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, textureFbm);

  gl.activeTexture(GL_TEXTURE1);
  gl.bindTexture(GL_TEXTURE_2D, textureText);

  gl.uniform1f(
    gl.getUniformLocation(program, 't'),
    time,
  );
  gl.uniform1i(
    gl.getUniformLocation(program, 'f'),
    0,
  );
  gl.uniform1i(
    gl.getUniformLocation(program, 'g'),
    1,
  );

  gl.bindFramebuffer(GL_FRAMEBUFFER, framebufferScene);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);

  // -- post process pass --------------------------------------------------------------------------
  program = programs.post;

  gl.useProgram(program);

  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, textureScene);

  gl.uniform1f(
    gl.getUniformLocation(program, 't'),
    time,
  );
  gl.uniform1i(
    gl.getUniformLocation(program, 'f'),
    0,
  );
  gl.uniform1f(
    gl.getUniformLocation(program, 'zoom'),
    evalSequence(sequences.zoom, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(program, 'shake'),
    evalSequence(sequences.shake, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(program, 'tile'),
    evalSequence(sequences.tile, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(program, 'kaleidoscope'),
    evalSequence(sequences.kaleidoscope, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(program, 'codercolor'),
    evalSequence(sequences.codercolor, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(program, 'chougouyoku'),
    evalSequence(sequences.chougouyoku, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(program, 'white'),
    evalSequence(sequences.white, beat)!,
  );

  gl.bindFramebuffer(GL_FRAMEBUFFER, null);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
}
