import { GL_FRAMEBUFFER, GL_TEXTURE0, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from './gl-constants';
import { BPM, HEIGHT, WIDTH } from './constants';
import { ENABLE_SEEKING, INTRO_LENGTH, STOP_RENDERING_AFTER_END } from './config';
import { audio } from './audio';
import { textureFbm } from './textureFbm';
import { framebufferScene, textureScene } from './textureScene';
import { gl } from './gl';
import { seekBeginTime } from './music';
import { programs } from './programs/programs';
import { sequences } from './sequence/sequences';
import { evalSequence } from './sequence/evalSequence';

import './programs/loadPrograms';
import './sequence/buildSequences';

/**
 * Renders the main scene.
 */
export function render(): void {
  let time = audio.currentTime;

  if (ENABLE_SEEKING) {
    time -= seekBeginTime;
  }

  // prevent using a GPU after the content ends
  if (STOP_RENDERING_AFTER_END) {
    if (time > INTRO_LENGTH) { return; }
  }

  const beat = time * BPM / 60.0;

  // -- scene pass ---------------------------------------------------------------------------------
  const programScene = evalSequence(sequences.scene, beat)!;

  gl.useProgram(programScene);

  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, textureFbm);

  gl.uniform1f(
    gl.getUniformLocation(programScene, 't'),
    time,
  );
  gl.uniform1i(
    gl.getUniformLocation(programScene, 'f'),
    0,
  );

  gl.bindFramebuffer(GL_FRAMEBUFFER, framebufferScene);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);

  // -- post process pass --------------------------------------------------------------------------
  const programPost = programs.post;

  gl.useProgram(programPost);

  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, textureScene);

  gl.uniform1f(
    gl.getUniformLocation(programPost, 't'),
    time,
  );
  gl.uniform1i(
    gl.getUniformLocation(programPost, 'f'),
    0,
  );
  gl.uniform1f(
    gl.getUniformLocation(programPost, 'zoom'),
    evalSequence(sequences.zoom, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programPost, 'kaleidoscope'),
    evalSequence(sequences.kaleidoscope, beat)!,
  );
  gl.uniform1f(
    gl.getUniformLocation(programPost, 'codercolor'),
    evalSequence(sequences.codercolor, beat)!,
  );

  gl.bindFramebuffer(GL_FRAMEBUFFER, null);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
}
