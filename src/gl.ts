import { GL_BLEND, GL_ONE, GL_ONE_MINUS_SRC_ALPHA } from './gl-constants';
import { canvas } from './ui';

/**
 * The main WebGL2 rendering context.
 */
export const gl = canvas.getContext('webgl2')!;

gl.getExtension('EXT_color_buffer_float');
gl.getExtension('OES_texture_float_linear');

gl.enable(GL_BLEND);
gl.blendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA); // premultiplied alpha please
