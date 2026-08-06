import { lazyQuadProgram } from './lazyQuadProgram';
import sceneFrag from './assets/scene.frag?shader';

/**
 * A WebGLProgram that renders the main scene.
 */
export const programScene = lazyQuadProgram(sceneFrag);
