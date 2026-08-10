import type { Sequence } from './Sequence';

export const sequences = {} as {
  scene: Sequence<WebGLProgram>;
  zoom: Sequence<number>;
  kaleidoscope: Sequence<number>;
  codercolor: Sequence<number>;
};
