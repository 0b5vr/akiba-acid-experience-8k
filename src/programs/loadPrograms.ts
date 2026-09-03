import { lazyQuadProgram } from './lazyQuadProgram';
import aep3dFrag from './assets/aep3d.frag?shader';
import aepcheckerFrag from './assets/aepchecker.frag?shader';
import boxFrag from './assets/box.frag?shader';
import boxarrayFrag from './assets/boxarray.frag?shader';
import checkerskyFrag from './assets/checkersky.frag?shader';
import crabFrag from './assets/crab.frag?shader';
import cubetunnelFrag from './assets/cubetunnel.frag?shader';
import dotmatrixFrag from './assets/dotmatrix.frag?shader';
import fbmFrag from './assets/fbm.frag?shader';
import foldarcFrag from './assets/foldarc.frag?shader';
import funnelFrag from './assets/funnel.frag?shader';
import iceplanesFrag from './assets/iceplanes.frag?shader';
import juliaFrag from './assets/julia.frag?shader';
import latticeFrag from './assets/lattice.frag?shader';
import morph3dFrag from './assets/morph3d.frag?shader';
import musicFrag from './assets/music.frag?shader';
import noiseauraFrag from './assets/noiseaura.frag?shader';
import nopFrag from './assets/nop.frag?shader';
import plasmaFrag from './assets/plasma.frag?shader';
import postFrag from './assets/post.frag?shader';
import smileyFrag from './assets/smiley.frag?shader';
import smiley3dFrag from './assets/smiley3d.frag?shader';
import smokySunFrag from './assets/smokySun.frag?shader';
import smiley7010Frag from './assets/smiley7010.frag?shader';
import swirlFrag from './assets/swirl.frag?shader';
import textFrag from './assets/text.frag?shader';
import textscrollFrag from './assets/textscroll.frag?shader';
import { programs } from './programs';

// -- programs -------------------------------------------------------------------------------------
// Compiles every shader in the intro.
// This is where the programs come from in the prod build as well, not just on a dev build HMR.

programs.aep3d = lazyQuadProgram(aep3dFrag);
programs.aepchecker = lazyQuadProgram(aepcheckerFrag);
programs.box = lazyQuadProgram(boxFrag);
programs.boxarray = lazyQuadProgram(boxarrayFrag);
programs.checkersky = lazyQuadProgram(checkerskyFrag);
programs.crab = lazyQuadProgram(crabFrag);
programs.cubetunnel = lazyQuadProgram(cubetunnelFrag);
programs.dotmatrix = lazyQuadProgram(dotmatrixFrag);
programs.fbm = lazyQuadProgram(fbmFrag);
programs.foldarc = lazyQuadProgram(foldarcFrag);
programs.funnel = lazyQuadProgram(funnelFrag);
programs.iceplanes = lazyQuadProgram(iceplanesFrag);
programs.julia = lazyQuadProgram(juliaFrag);
programs.lattice = lazyQuadProgram(latticeFrag);
programs.morph3d = lazyQuadProgram(morph3dFrag);
programs.music = lazyQuadProgram(musicFrag);
programs.noiseaura = lazyQuadProgram(noiseauraFrag);
programs.nop = lazyQuadProgram(nopFrag);
programs.plasma = lazyQuadProgram(plasmaFrag);
programs.post = lazyQuadProgram(postFrag);
programs.smiley = lazyQuadProgram(smileyFrag);
programs.smiley3d = lazyQuadProgram(smiley3dFrag);
programs.smokySun = lazyQuadProgram(smokySunFrag);
programs.smiley7010 = lazyQuadProgram(smiley7010Frag);
programs.swirl = lazyQuadProgram(swirlFrag);
programs.text = lazyQuadProgram(textFrag);
programs.textscroll = lazyQuadProgram(textscrollFrag);

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  import.meta.hot.accept();
}
