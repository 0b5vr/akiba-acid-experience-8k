import { GL_FRAMEBUFFER, GL_TEXTURE0, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from './gl-constants';
import { HEIGHT, WIDTH } from './constants';
import { ENABLE_SEEKING, INTRO_LENGTH, STOP_RENDERING_AFTER_END } from './config';
import { audio } from './audio';
import { textureFbm } from './textureFbm';
import { framebufferScene, textureScene } from './textureScene';
import { gl } from './gl';
import { seekBeginTime } from './music';
import { programScene } from './programScene';
import { programPost } from './programPost';

let programSceneHot = programScene;
let programPostHot = programPost;

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
  gl.useProgram(programSceneHot);

  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, textureFbm);

  gl.uniform1f(
    gl.getUniformLocation(programSceneHot, 't'),
    time,
  );
  gl.uniform1i(
    gl.getUniformLocation(programSceneHot, 'f'),
    0,
  );

  gl.bindFramebuffer(GL_FRAMEBUFFER, framebufferScene);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);

  // -- post process pass ----------------------------------------------------------------------------
  gl.useProgram(programPostHot);

  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, textureScene);

  gl.uniform1i(
    gl.getUniformLocation(programPostHot, 'f'),
    0,
  );

  gl.bindFramebuffer(GL_FRAMEBUFFER, null);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
}

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  import.meta.hot.accept('./programScene', (mod) => {
    if (mod == null) { return; }
    programSceneHot = mod.programScene;
  });
  import.meta.hot.accept('./programPost', (mod) => {
    if (mod == null) { return; }
    programPostHot = mod.programPost;
  });
}
