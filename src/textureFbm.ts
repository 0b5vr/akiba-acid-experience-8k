import { GL_COLOR_ATTACHMENT0, GL_FRAMEBUFFER, GL_R32F, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from './gl-constants';
import { gl } from './gl';
import { programs } from './programs/programs';

import './programs/loadPrograms';

// -- texture --------------------------------------------------------------------------------------
const SIZE = 1024;

/**
 * The 2D texture containing the precomputed 3D fbm noise.
 */
export const textureFbm = gl.createTexture()!;

gl.bindTexture(GL_TEXTURE_2D, textureFbm);
gl.texStorage2D(GL_TEXTURE_2D, 1, GL_R32F, SIZE, SIZE);

// -- framebuffer ----------------------------------------------------------------------------------
const framebuffer = gl.createFramebuffer()!;

gl.bindFramebuffer(GL_FRAMEBUFFER, framebuffer);
gl.framebufferTexture2D(
  GL_FRAMEBUFFER,
  GL_COLOR_ATTACHMENT0,
  GL_TEXTURE_2D,
  textureFbm,
  0,
);

// -- render ---------------------------------------------------------------------------------------
gl.useProgram(programs.fbm);

gl.viewport(0, 0, SIZE, SIZE);
gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  /**
   * The program that is used to bake the noise into {@link textureFbm} last time.
   */
  let currentProgram = programs.fbm;

  import.meta.hot.on('vite:afterUpdate', () => {
    if (currentProgram === programs.fbm) { return; }
    currentProgram = programs.fbm;

    gl.useProgram(programs.fbm);

    gl.bindFramebuffer(GL_FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
  });
}
