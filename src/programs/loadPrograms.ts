import { lazyQuadProgram } from './lazyQuadProgram';
import boxFrag from './assets/box.frag?shader';
import boxarrayFrag from './assets/boxarray.frag?shader';
import fbmFrag from './assets/fbm.frag?shader';
import latticeFrag from './assets/lattice.frag?shader';
import musicFrag from './assets/music.frag?shader';
import noiseauraFrag from './assets/noiseaura.frag?shader';
import nopFrag from './assets/nop.frag?shader';
import postFrag from './assets/post.frag?shader';
import smileyFrag from './assets/smiley.frag?shader';
import textFrag from './assets/text.frag?shader';
import { programs } from './programs';

// -- programs -------------------------------------------------------------------------------------
// Compiles every shader in the intro.
// This is where the programs come from in the prod build as well, not just on a dev build HMR.

programs.box = lazyQuadProgram(boxFrag);
programs.boxarray = lazyQuadProgram(boxarrayFrag);
programs.fbm = lazyQuadProgram(fbmFrag);
programs.lattice = lazyQuadProgram(latticeFrag);
programs.music = lazyQuadProgram(musicFrag);
programs.noiseaura = lazyQuadProgram(noiseauraFrag);
programs.nop = lazyQuadProgram(nopFrag);
programs.post = lazyQuadProgram(postFrag);
programs.smiley = lazyQuadProgram(smileyFrag);
programs.text = lazyQuadProgram(textFrag);

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  import.meta.hot.accept();
}
