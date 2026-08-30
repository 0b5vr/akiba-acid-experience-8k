import { GL_COLOR_ATTACHMENT0, GL_FRAMEBUFFER, GL_FRAMEBUFFER_COMPLETE, GL_RGBA16F, GL_TEXTURE_2D } from '../gl-constants';
import { HEIGHT, WIDTH } from '../constants';
import { gl } from '../gl';
import { LOG_SHADER_ERRORS } from '../config';

/**
 * The 2D texture that the post process pass renders into.
 *
 * It's a float texture since it's used for video feedback.
 */
export const texturePost = gl.createTexture()!;

gl.bindTexture(GL_TEXTURE_2D, texturePost);
gl.texStorage2D(GL_TEXTURE_2D, 1, GL_RGBA16F, WIDTH, HEIGHT);

/**
 * The framebuffer wrapping {@link texturePost}.
 */
export const framebufferPost = gl.createFramebuffer()!;

gl.bindFramebuffer(GL_FRAMEBUFFER, framebufferPost);
gl.framebufferTexture2D(
  GL_FRAMEBUFFER,
  GL_COLOR_ATTACHMENT0,
  GL_TEXTURE_2D,
  texturePost,
  0,
);

if (LOG_SHADER_ERRORS) {
  if (gl.checkFramebufferStatus(GL_FRAMEBUFFER) !== GL_FRAMEBUFFER_COMPLETE) {
    throw new Error('framebufferPost is incomplete. RGBA16F may not be color-renderable here.');
  }
}
