import { GL_FRAMEBUFFER, GL_TEXTURE0, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from './gl-constants';
import { BPM, HEIGHT, WIDTH } from './constants';
import { ENABLE_SEEKING, INTRO_LENGTH, STOP_RENDERING_AFTER_END } from './config';
import { audio } from './audio';
import { textureFbm } from './textureFbm';
import { framebufferScene, textureScene } from './textureScene';
import { gl } from './gl';
import { seekBeginTime } from './music';
import { programs } from './programs/programs';

import './programs/loading';

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

  // -- scene pass -------------------------------------------------------------------------------------
  const programScene = (time * BPM / 60.0) % 2.0 < 1.0 ? programs.box : programs.lattice;

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

  // -- post process pass ----------------------------------------------------------------------------
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

  gl.bindFramebuffer(GL_FRAMEBUFFER, null);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
}
