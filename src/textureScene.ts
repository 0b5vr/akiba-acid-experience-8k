import { GL_COLOR_ATTACHMENT0, GL_FRAMEBUFFER, GL_RGBA8, GL_TEXTURE_2D } from './gl-constants';
import { HEIGHT, WIDTH } from './constants';
import { gl } from './gl';

// -- texture --------------------------------------------------------------------------------------
/**
 * The 2D texture that the scene pass renders into, to be consumed by the post process pass.
 */
export const textureScene = gl.createTexture()!;

gl.bindTexture(GL_TEXTURE_2D, textureScene);
gl.texStorage2D(GL_TEXTURE_2D, 1, GL_RGBA8, WIDTH, HEIGHT);

// -- framebuffer ----------------------------------------------------------------------------------
/**
 * The framebuffer wrapping {@link textureScene}.
 */
export const framebufferScene = gl.createFramebuffer()!;

gl.bindFramebuffer(GL_FRAMEBUFFER, framebufferScene);
gl.framebufferTexture2D(
  GL_FRAMEBUFFER,
  GL_COLOR_ATTACHMENT0,
  GL_TEXTURE_2D,
  textureScene,
  0,
);
