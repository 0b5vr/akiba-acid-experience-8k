import { lazyQuadProgram } from './lazyQuadProgram';
import aep3dFrag from './assets/aep3d.frag?shader';
import aepcheckerFrag from './assets/aepchecker.frag?shader';
import chainFrag from './assets/chain.frag?shader';
import checkerskyFrag from './assets/checkersky.frag?shader';
import copyFrag from './assets/copy.frag?shader';
import crabFrag from './assets/crab.frag?shader';
import cubetunnelFrag from './assets/cubetunnel.frag?shader';
import foldarcFrag from './assets/foldarc.frag?shader';
import boxTownFrag from './assets/boxTown.frag?shader';
import funnelFrag from './assets/funnel.frag?shader';
import iceplanesFrag from './assets/iceplanes.frag?shader';
import ifsTunnelFrag from './assets/ifsTunnel.frag?shader';
import juliaFrag from './assets/julia.frag?shader';
import latticeFrag from './assets/lattice.frag?shader';
import logSmileyFrag from './assets/logSmiley.frag?shader';
import morph3dFrag from './assets/morph3d.frag?shader';
import musicFrag from './assets/music.frag?shader';
import plasmaFrag from './assets/plasma.frag?shader';
import postFrag from './assets/post.frag?shader';
import smileyFrag from './assets/smiley.frag?shader';
import smiley3dFrag from './assets/smiley3d.frag?shader';
import smiley7010Frag from './assets/smiley7010.frag?shader';
import swirlFrag from './assets/swirl.frag?shader';
import textFrag from './assets/text.frag?shader';
import textscrollFrag from './assets/textscroll.frag?shader';
import { programs } from './programs';

// -- programs -------------------------------------------------------------------------------------
// Compiles every shader in the intro.
// This is where the programs come from in the prod build as well, not just on a dev build HMR.

programs.music = lazyQuadProgram(musicFrag);
programs.aep3d = lazyQuadProgram(aep3dFrag);
programs.aepchecker = lazyQuadProgram(aepcheckerFrag);
programs.chain = lazyQuadProgram(chainFrag);
programs.checkersky = lazyQuadProgram(checkerskyFrag);
programs.copy = lazyQuadProgram(copyFrag);
programs.crab = lazyQuadProgram(crabFrag);
programs.cubetunnel = lazyQuadProgram(cubetunnelFrag);
programs.foldarc = lazyQuadProgram(foldarcFrag);
programs.boxTown = lazyQuadProgram(boxTownFrag);
programs.funnel = lazyQuadProgram(funnelFrag);
programs.iceplanes = lazyQuadProgram(iceplanesFrag);
programs.ifsTunnel = lazyQuadProgram(ifsTunnelFrag);
programs.julia = lazyQuadProgram(juliaFrag);
programs.lattice = lazyQuadProgram(latticeFrag);
programs.logSmiley = lazyQuadProgram(logSmileyFrag);
programs.morph3d = lazyQuadProgram(morph3dFrag);
programs.plasma = lazyQuadProgram(plasmaFrag);
programs.post = lazyQuadProgram(postFrag);
programs.smiley = lazyQuadProgram(smileyFrag);
programs.smiley3d = lazyQuadProgram(smiley3dFrag);
programs.smiley7010 = lazyQuadProgram(smiley7010Frag);
programs.swirl = lazyQuadProgram(swirlFrag);
programs.text = lazyQuadProgram(textFrag);
programs.textscroll = lazyQuadProgram(textscrollFrag);

// -- hot ------------------------------------------------------------------------------------------
if (import.meta.hot) {
  import.meta.hot.accept();
}
