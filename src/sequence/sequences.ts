import type { Sequence } from './Sequence';

export const sequences = {} as {
  scene: Sequence<WebGLProgram>;
  overlay: Sequence<WebGLProgram>;
  zoom: Sequence<number>;
  tile: Sequence<number>;
  kaleidoscope: Sequence<number>;
  codercolor: Sequence<number>;
  chougouyoku: Sequence<number>;
};
