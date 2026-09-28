#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

import { relative } from 'https://deno.land/std@0.221.0/path/relative.ts';
import { expandGlob } from 'https://deno.land/std@0.221.0/fs/expand_glob.ts';
import { parseArgs } from 'https://deno.land/std@0.221.0/cli/parse_args.ts';
import { blue, dim, green, red } from 'https://deno.land/std@0.221.0/fmt/colors.ts';
import { Table } from 'jsr:@cliffy/table@1.2.1';

import { analyze } from './analysis/analyze.ts';
import { DEFAULT_PARAMS, type CompressionParams } from './CompressionParams.ts';
import { SELECTOR_LIMIT } from './constants.ts';
import { encode } from './encode.ts';
import { buildDecoder } from './buildDecoder.ts';
import { pack, PackResult } from './pack.ts';
import { optimize } from './optimize.ts';
import { haveZopfli } from './deflate/haveZopfli.ts';
import { cloneCompressionParams } from './utils/cloneCompressionParams.ts';
import { AnalyzeOrder } from './analysis/AnalyzeOrder.ts';
import { sortAnalyzeSourceResults } from './analysis/sortAnalyzeSourceResults.ts';

// -- arguments ------------------------------------------------------------------------------------
const USAGE = `Usage: deno run --allow-read --allow-write --allow-run compressor/index.ts [-O<level>] [-P<path>] [--analyze=<input.js.map>] [--analyze-order=${Object.values(AnalyzeOrder).join('|')}] input.js output.html`;

const args = parseArgs(Deno.args, {
  string: ['O', 'P', 'analyze', 'analyze-order'],
  default: { 'O': '0', 'analyze-order': 'size' },
});
const positional = args._.map(String);
const level = Number(args.O);
const paramsPath = args.P;
const analyzeGlob = args.analyze;

// validate positional arguments
if (positional.length < 2) {
  console.error(USAGE);
  Deno.exit(1);
}

// validate -O
if (!(Number.isInteger(level) && level >= 0 && level <= 2)) {
  console.error(red(`Optimization level must be within 0..2: ${args.O}`));
  console.error(USAGE);
  Deno.exit(1);
}

// validate --analyze-order
if (!Object.values(AnalyzeOrder).includes(args['analyze-order'] as AnalyzeOrder)) {
  console.error(red(`Unknown analyze order: ${args['analyze-order']}`));
  console.error(USAGE);
  Deno.exit(1);
}

const analyzeOrder = args['analyze-order'] as AnalyzeOrder;

// -- params ---------------------------------------------------------------------------------------
let params: CompressionParams = cloneCompressionParams(DEFAULT_PARAMS);
if (paramsPath) {
  let loaded: Partial<CompressionParams> = {};
  try {
    loaded = JSON.parse(await Deno.readTextFile(paramsPath)) as Partial<CompressionParams>;
  } catch {
    console.error(red(`Failed to read params file: ${paramsPath}`));
    Deno.exit(1);
  }
  params = {
    ...DEFAULT_PARAMS,
    ...loaded,
  };
}

if (params.sparseSelectors.some((s) => !(s >= 0 && s < SELECTOR_LIMIT))) {
  console.error(red(`Selectors must be within 0..${SELECTOR_LIMIT - 1}`));
  Deno.exit(1);
}

if (!(params.precision >= 1 && params.precision <= 16)) {
  console.error(red('Precision must be within 1..16'));
  Deno.exit(1);
}

// the decoder always ships deflated (see pack.ts), so zopfli is not optional here
if (!await haveZopfli()) {
  console.error(red('zopfli is not installed or not visible via PATH'));
  Deno.exit(1);
}

// -- file stuff -----------------------------------------------------------------------------------
const inputGlob = positional[0];
const inputEntry = await expandGlob(inputGlob).next();
const inputPath = inputEntry?.value?.path;

if (!inputPath) {
  console.error(red(`Glob did not match: ${inputGlob}`));
  Deno.exit(1);
}
const inputPathRelative = relative('.', inputPath);
console.info(`Input file: ${blue(inputPathRelative)}`);

const outputPath = positional[1];
console.info(`Output file: ${blue(outputPath)}`);

// -- main -----------------------------------------------------------------------------------------
const inputText = await Deno.readTextFile(inputPath);
const inputBytes = new TextEncoder().encode(inputText);
const inputSize = inputBytes.length;
console.info(`Input size: ${green(`${inputSize.toLocaleString()} bytes`)}`);

const inBits = inputBytes.every((c) => c <= 0x7f) ? 7 : 8;

const timeBegin = performance.now();

console.info('Compressing the file...');

let packed: PackResult;

try {
  if (level > 0) {
    console.info(`Optimizing for parameters (-O${level})...`);
    packed = await optimize(inputBytes, inBits, params, level);
    const elapsed = ((performance.now() - timeBegin) / 1000).toFixed(1);

    console.info(`Optimization done in ${green(`${elapsed} s`)}`);

    if (paramsPath) {
      await Deno.writeTextFile(paramsPath, `${JSON.stringify(packed.params, null, 2)}\n`);
      console.info(`Updated ${blue(paramsPath)}`);
    }
  } else {
    packed = await pack(inputBytes, inBits, params);
  }
} catch (e: any) {
  console.error(red(`Error during compression: ${e.message}`));
  Deno.exit(1);
}

// -- output ---------------------------------------------------------------------------------------
const concated = new Uint8Array(packed.size);
concated.set(packed.headerBytes);
concated.set(packed.data, packed.headerBytes.length);
concated.set(packed.trailer, packed.headerBytes.length + packed.data.length);

// -- report ---------------------------------------------------------------------------------------
const percentage = (100.0 * (packed.size / inputSize)).toFixed(3);
console.info(`Header size: ${green(`${packed.headerBytes.length.toLocaleString()} bytes`)}`);
console.info(`Data size: ${green(`${packed.data.length.toLocaleString()} bytes`)}`);
if (packed.trailer.length > 0) {
  console.info(`Deflated decoder: ${green(`${packed.trailer.length.toLocaleString()} bytes`)}`);
}
console.info(`Output size: ${green(`${packed.size.toLocaleString()} bytes`)} (${percentage} %)`);

// -- verify ---------------------------------------------------------------------------------------
console.info('Verifying the generated decoder...');

const { quotesSeen } = encode(inputBytes, inBits, packed.params);
const decoder = buildDecoder(packed.params, inputSize, inBits, quotesSeen, packed.skip, false);

// deno-lint-ignore no-eval
const decoded = (0, eval)(decoder)(concated);
if (decoded !== inputText) {
  console.error(red('The decoder did not reproduce the input'));
  Deno.exit(1);
}

// -- write ----------------------------------------------------------------------------------------
await Deno.writeFile(outputPath, concated);

console.info(`Done ${green('✓')}`);

// -- analysis -------------------------------------------------------------------------------------
if (analyzeGlob) {
  const mapEntry = await expandGlob(analyzeGlob).next();
  const mapPath = mapEntry?.value?.path;

  if (!mapPath) {
    console.error(red(`Glob did not match: ${analyzeGlob}`));
    Deno.exit(1);
  }

  console.info('');
  console.info(`Analyzing using the sourcemap ${blue(relative('.', mapPath))}...`);
  console.info('');

  const rawSourceMap = JSON.parse(await Deno.readTextFile(mapPath));
  const results = analyze(inputText, inBits, packed.params, rawSourceMap);
  const sorted = sortAnalyzeSourceResults(results, analyzeOrder);

  const totalCostBits = sorted.reduce((sum, { costBits }) => sum + costBits, 0);
  const nameWidth = Math.min(60, Math.max(...sorted.map(({ source }) => source.length)));

  /** Trims the leading `../` of a source and fits it into {@link nameWidth}. */
  const shorten = (source: string): string => {
    const trimmed = source.replace(/^(\.\.\/)+/, '');
    return trimmed.length <= nameWidth ? trimmed : `…${trimmed.slice(1 - nameWidth)}`;
  };

  new Table()
    .header(['', ...['input', 'packed', 'ratio', 'share'].map(dim)])
    .body(sorted.map(({ source, rawBytes, costBits }) => [
      shorten(source),
      rawBytes.toLocaleString(),
      green((costBits / 8).toFixed(1)),
      (costBits / (8 * rawBytes)).toFixed(3),
      `${(100 * costBits / totalCostBits).toFixed(2)} %`,
    ]))
    .align('right')
    .column(0, { align: 'left' })
    .padding(2)
    .render();
  console.info('');
}
