import type { Sequence } from './Sequence';

export const sequences = {} as {
  scene: Sequence<WebGLProgram>;
  overlay: Sequence<WebGLProgram>;
  text: Sequence<string>;
};
