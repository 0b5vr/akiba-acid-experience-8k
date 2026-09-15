import { GL_RGBA, GL_RGBA8, GL_TEXTURE_2D, GL_UNPACK_FLIP_Y_WEBGL, GL_UNSIGNED_BYTE } from '../gl-constants';
import { HEIGHT, WIDTH } from '../constants';
import { gl } from '../gl';

// -- canvas -----------------------------------------------------------------------------------------
/**
 * An offscreen Canvas2D canvas the text is drawn onto, before it gets uploaded into {@link textureText}.
 */
const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;

const context = canvas.getContext('2d')!;

// -- texture ------------------------------------------------------------------------------------
/**
 * The 2D texture containing the rendered text, to be sampled by `text.frag`.
 */
export const textureText = gl.createTexture()!;

gl.bindTexture(GL_TEXTURE_2D, textureText);
gl.texStorage2D(GL_TEXTURE_2D, 1, GL_RGBA8, WIDTH, HEIGHT);

// -- draw -----------------------------------------------------------------------------------------
/**
 * The text that is currently baked into {@link textureText}.
 */
let currentText: string | undefined;

/**
 * Draws the given text onto {@link canvas} and uploads it into {@link textureText}.
 * Does nothing if the given text is identical to the one already baked in.
 */
export function updateTextureText(text: string): void {
  if (text === currentText) { return; }
  currentText = text;

  context.reset();
  context.fillStyle = '#000';
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = '#fff';
  context.font = `${HEIGHT}px Impact`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const srcWidth = context.measureText(text).width;
  context.translate(WIDTH / 2, HEIGHT / 2);
  context.scale(0.8 * WIDTH / srcWidth, 0.8);
  context.fillText(text, 0, 0);

  gl.bindTexture(GL_TEXTURE_2D, textureText);
  gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, true);
  gl.texSubImage2D(GL_TEXTURE_2D, 0, 0, 0, WIDTH, HEIGHT, GL_RGBA, GL_UNSIGNED_BYTE, canvas);
  gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, false);
}
