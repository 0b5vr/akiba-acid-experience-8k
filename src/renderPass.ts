import { GL_BLEND, GL_TEXTURE0, GL_TEXTURE1, GL_TEXTURE_2D, GL_TRIANGLES } from './gl-constants';
import { HEIGHT, WIDTH } from './constants';
import { gl } from './gl';
import { textureText } from './textures/textureText';

/**
 * `useProgram`, `viewport`, bind the textures, and set the common uniforms for a fullscreen quad pass.
 */
export function preparePass(
  program: WebGLProgram,
  time: number,
  tex0: WebGLTexture = textureText,
): void {
  gl.useProgram(program);

  gl.enable(GL_BLEND);
  gl.viewport(0, 0, WIDTH, HEIGHT);

  gl.activeTexture(GL_TEXTURE0);
  gl.bindTexture(GL_TEXTURE_2D, tex0);

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
}

/**
 * {@link preparePass} + `drawArray`.
 */
export function renderPass(
  program: WebGLProgram,
  time: number,
  tex0: WebGLTexture = textureText,
): void {
  preparePass(program, time, tex0);

  gl.drawArrays(GL_TRIANGLES, 0, 3);
}
