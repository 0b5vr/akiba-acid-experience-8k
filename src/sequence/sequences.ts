import type { Sequence } from './Sequence';

export const sequences = {} as {
  scene: Sequence<WebGLProgram>;
  overlay: Sequence<WebGLProgram>;
  text: Sequence<string>;
  zoom: Sequence<number>;
  shake: Sequence<number>;
  tile: Sequence<number>;
  kaleidoscope: Sequence<number>;
  codercolor: Sequence<number>;
  posterize: Sequence<number>;
  chougouyoku: Sequence<number>;
  white: Sequence<number>;
  feedback: Sequence<number>;
};
