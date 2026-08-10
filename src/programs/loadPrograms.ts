import { lazyQuadProgram } from './lazyQuadProgram';
import musicFrag from './assets/music.frag?shader';
import postFrag from './assets/post.frag?shader';
import fbmFrag from './assets/fbm.frag?shader';
import boxFrag from './assets/box.frag?shader';
import latticeFrag from './assets/lattice.frag?shader';
import { programs } from './programs';

// -- programs -------------------------------------------------------------------------------------
// Compiles every shader in the intro.
// This is where the programs come from in the prod build as well, not just on a dev build HMR.

programs.music = lazyQuadProgram(musicFrag);
programs.post = lazyQuadProgram(postFrag);
programs.fbm = lazyQuadProgram(fbmFrag);
programs.box = lazyQuadProgram(boxFrag);
programs.lattice = lazyQuadProgram(latticeFrag);

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  import.meta.hot.accept();
}
