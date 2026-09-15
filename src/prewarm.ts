import { GL_FRAMEBUFFER } from './gl-constants';
import { framebufferScene } from './textures/textureScene';
import { gl } from './gl';
import { programs } from './programs/programs';
import { renderPass } from './renderPass';

import './programs/loadPrograms';

/**
 * Draws every program once, to force the ANGLE to compile them.
 */
export function prewarm(): void {
  gl.bindFramebuffer(GL_FRAMEBUFFER, framebufferScene);

  Object.values(programs).map((program) => (
    renderPass(program, 0)
  ));

  // we probably don't need this
  // gl.finish();
}
