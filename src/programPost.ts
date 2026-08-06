import { lazyQuadProgram } from './lazyQuadProgram';
import postFrag from './assets/post.frag?shader';

/**
 * A WebGLProgram that applies a post process to the rendered scene.
 */
export const programPost = lazyQuadProgram(postFrag);
