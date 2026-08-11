import { GL_BLEND, GL_FRAMEBUFFER, GL_ONE, GL_TEXTURE0, GL_TEXTURE1, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from './gl-constants';
import { BPM, HEIGHT, WIDTH } from './constants';
import { ENABLE_SEEKING, INTRO_LENGTH, STOP_RENDERING_AFTER_END } from './config';
import { audio } from './audio';
import { textureFbm } from './textureFbm';
import { textureText, updateTextureText } from './textureText';
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
  updateTextureText(evalSequence(sequences.text, beat)!);

  gl.enable(GL_BLEND);
  gl.blendFunc(GL_ONE, GL_ONE);

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

  gl.disable(GL_BLEND);

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

  gl.bindFramebuffer(GL_FRAMEBUFFER, null);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
}
