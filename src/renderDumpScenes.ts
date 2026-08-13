import { GL_COLOR_BUFFER_BIT, GL_FRAMEBUFFER, GL_TEXTURE0, GL_TEXTURE1, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from './gl-constants';
import { BPM, HEIGHT, WIDTH } from './constants';
import { textureFbm } from './textureFbm';
import { textureText, updateTextureText } from './textureText';
import { gl } from './gl';
import { programs } from './programs/programs';
import { sequences } from './sequence/sequences';
import { evalSequence } from './sequence/evalSequence';

const DUMP_SCENE_KEYS = [
  'acidsquelch',
  'acidsquiggle',
  'auroraribbon',
  'binaryrain',
  'blackoutflash',
  'blocknoise',
  'bokehparticles',
  'box',
  'boxarray',
  'bpminterference',
  'cagetunnel',
  'cassettereel',
  'caustics',
  'cellularautomaton',
  'checkersky',
  'chromaticzoom',
  'chromechain',
  'chromelogo',
  'circletunnel',
  'crtphosphor',
  'cubetunnel',
  'cymatics',
  'datamosh',
  'dichroicglass',
  'domainwarp',
  'dotmatrix',
  'fbm',
  'flashgrid',
  'fleshtunnel',
  'floweroflife',
  'frostcrystal',
  'geodesicdome',
  'glitchtext',
  'godray',
  'heartbeatscale',
  'hextunnel',
  'hologramlogo',
  'honeycombpulse',
  'impossiblestairs',
  'interlaceflicker',
  'isocubes',
  'jumpcubetunnel',
  'kaleidofold',
  'kaleidojulia',
  'kaleidotext',
  'kickshake',
  'lattice',
  'lavametalstream',
  'lensflare',
  'liquidmercury',
  'lissajous',
  'lsystemtree',
  'mandelbrotzoom',
  'marbleveins',
  'metalwavepool',
  'metatronscube',
  'mirrorball',
  'mirrorcorridor',
  'mirrorcubetower',
  'moire',
  'mudcrack',
  'music',
  'noiseaura',
  'nop',
  'particlepolyhedron',
  'patchcable',
  'penrose',
  'perlinworm',
  'pinart',
  'pipeorgan',
  'pistongrid',
  'plasmacloud',
  'platonicmorph',
  'post',
  'prismspectrum',
  'pulsebars',
  'pulsefloor',
  'qrglitch',
  'radialburst8',
  'radialspectrum',
  'reactiondiffusion',
  'refractioncave',
  'rgbsplit',
  'ridgedmountains',
  'samplehold',
  'scanwipe',
  'skeletalcubeglow',
  'smiley',
  'spikedblob',
  'spiralkaleido',
  'startunnel',
  'steelballpit',
  'stellatedpoly',
  'stepsequencer',
  'strobecheckerwalk',
  'strobesweep',
  'swirl',
  'symmetrysmear',
  'tesseract',
  'text',
  'toruswireknot',
  'trigrid',
  'tunerstatic',
  'twistcorridor',
  'vhsnoise',
  'voronoishell',
  'voronoishutter',
  'wagonwheel',
  'waveformpulsering',
  'waveformtube',
  'websymmetry',
  'wireglobe',
  'wormhole',
] as const satisfies (keyof typeof programs)[];

/**
 * Renders every scene (including overlays) to the screen in a grid layout.
 * Used when {@link DUMP_SCENES} is `true`, for showcasing the scenes in development.
 */
export function renderDumpScenes(time: number): void {
  const beat = time * BPM / 60.0;

  updateTextureText(evalSequence(sequences.text, beat)!);

  const cols = Math.ceil(Math.sqrt(DUMP_SCENE_KEYS.length));
  const rows = cols;
  const cellWidth = Math.floor(WIDTH / cols);
  const cellHeight = Math.floor(HEIGHT / rows);

  gl.bindFramebuffer(GL_FRAMEBUFFER, null);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(GL_COLOR_BUFFER_BIT);

  for (const [i, key] of DUMP_SCENE_KEYS.entries()) {
    const program = programs[key];
    const col = i % cols;
    const row = Math.floor(i / cols);

    gl.useProgram(program);

    gl.activeTexture(GL_TEXTURE0);
    gl.bindTexture(GL_TEXTURE_2D, textureFbm);

    gl.activeTexture(GL_TEXTURE1);
    gl.bindTexture(GL_TEXTURE_2D, textureText);

    gl.uniform1f(
      gl.getUniformLocation(program, 't'),
      time,
    );
    gl.uniform1i(
      gl.getUniformLocation(program, 'f'),
      0,
    );
    gl.uniform1i(
      gl.getUniformLocation(program, 'g'),
      1,
    );

    gl.viewport(
      col * cellWidth,
      HEIGHT - (row + 1) * cellHeight,
      cellWidth,
      cellHeight,
    );
    gl.drawArrays(GL_TRIANGLE_STRIP, 0, 4);
  }
}
