import { GL_LINEAR, GL_RGBA16F, GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER } from '../gl-constants';
import { HEIGHT, WIDTH } from '../constants';
import { gl } from '../gl';

/**
 * The 2D texture that holds the previous frame of the post process pass, for video feedback.
 */
export const textureBack = gl.createTexture()!;

gl.bindTexture(GL_TEXTURE_2D, textureBack);
gl.texStorage2D(GL_TEXTURE_2D, 1, GL_RGBA16F, WIDTH, HEIGHT);

// it should be GL_LINEAR since it's used for video feedback
gl.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

/**
 * Copies the current read framebuffer into {@link textureBack}.
 * Must be called right after the post process pass has drawn, while its framebuffer is still bound.
 */
export function copyToTextureBack(): void {
  gl.bindTexture(GL_TEXTURE_2D, textureBack);
  gl.copyTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, 0, 0, WIDTH, HEIGHT);
}
