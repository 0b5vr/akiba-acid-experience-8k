import type { CompressionParams } from './CompressionParams.ts';
import { ANS_BITS, OUT_BITS, OUT_SYMBOLS } from './constants.ts';

/**
 * Returns the approximately the value as a string in a shorter form.
 * It uses two significant digits and scientific notation if necessary.
 * The returned value is guaranteed to be larger than the input value.
 *
 * @param v The value to approximate.
 * @returns The approximated value as a string.
 */
export function approximateWithTwoSigDigits(v: number): string {
  let exp = 0;
  let tens = 1;
  while (v >= tens * 100) {
    exp++;
    tens *= 10;
  }
  let mantissa = Math.ceil(v / tens);
  if (mantissa % 10 === 0) {
    mantissa /= 10;
    exp++;
  }
  return exp > 1 ? `${mantissa}e${exp}` : `${mantissa * 10 ** exp}`;
}

/**
 * Returns 2^n as a string in a shorter form.
 * It reuses the decoder's `h` (= 2^(precision+1)) whenever that comes out shorter.
 *
 * @param n The exponent.
 * @param precision The `precision` used in the decoder.
 * @returns 2^n as a string.
 */
export function pow2(n: number, precision: number): string {
  if (n < 10 || n > precision + 10) { return `${2 ** n}`; }
  const d = n - (precision + 1);
  if (d < 0) { return `h/${2 ** -d}`; }
  if (d > 0) { return `h*${2 ** d}`; }
  return 'h';
}

/**
 * Returns the reciprocal of a number as a string in a shorter form.
 *
 * @param recipBaseCount The reciprocal base count.
 * @returns The reciprocal of the base count as a string.
 */
export function baseCountLiteral(recipBaseCount: number): string {
  const v = 1 / recipBaseCount;
  const short = `${v}`.replace(/^0/, '');
  return Number(short) === v && short.length <= `1/${recipBaseCount}`.length
    ? short
    : `1/${recipBaseCount}`;
}

/**
 * Returns a string of JavaScript code that decodes the output of {@link encode} back into a string.
 *
 * Pretty much a ripoff of Roadroller's implementation.
 *
 * @param params The compression parameters.
 * @param inputLength The length of the encoded input.
 * @param inBits The number of bits used for the input symbols.
 * @param quotesSeen The set of quote charcodes seen during encoding.
 * @param skip The number of bytes to skip at the beginning of the input.
 * @param evalResult Whether to eval the result in place, or hand it back for verification.
 * @returns The decoded string.
 */
export function buildDecoder(
  params: CompressionParams,
  inputLength: number,
  inBits: number,
  quotesSeen: Set<number>,
  skip: number,
  evalResult: boolean,
): string {
  const { precision, modelMaxCount, modelRecipBaseCount, recipLearningRate, contextBits } = params;
  const numModels = params.sparseSelectors.length;
  const deltaShift = 29 - precision;
  const inMax = 1 << inBits;
  const contextSize = approximateWithTwoSigDigits(numModels << contextBits);
  const quotes = [...quotesSeen].sort((a, b) => a - b);

  const args = [
    // The whole file as a Uint8Array
    'A',

    // 2^(precision+1)
    `h=1<<${precision + 1}`,

    // weights
    `w=[${Array(numModels).fill(0)}]`,

    // counts
    `d=new Uint16Array(${contextSize})`,

    // predictions
    `p=new Uint16Array(${contextSize}).fill(${pow2(precision - 1, precision)})`,

    // decoded output
    'o=[]',

    // rANS state
    's=0',

    // read head in A
    `r=${skip}`,

    // write head in o
    'l=0',

    // the quote charcode we are currently inside of, or 0 if outside
    ...quotes.length > 0 ? ['g=0'] : [],

    // bit context
    'n',

    // mixed prediction
    'm',

    // scratch
    'a',

    // decoded bit
    'v',

    // stretched predictions
    'e',

    // indices
    'f',
  ].join(',');

  // -- Three nested loops! ------------------------------------------------------------------------

  // continue till the write pos reaches the end
  const firstCond = `l<${inputLength}`;

  // reads one byte at a time + updates the quote state
  const firstAfter = quotes.length === 0
    ? `o[l++]=n-${inMax}`
    : quotes.length === 1
      ? `o[l++]=n-=${inMax},g^=n==${quotes[0]}`
      : `o[l++]=n-=${inMax},g=g?n-g&&g:(${quotes.map((q) => `n==${q}`).join('|')})&&n`;

  // reset the bit context to 1
  const secondInit = 'n=1';

  // continues till the bit context reaches the end of the byte
  const secondCond = `n<${inMax}`;

  // reads one bit at a time and do the rANS decode
  const secondAfter = [
    // for each model,
    `e=f.map((y,i)=>(${
      [
        // scale the prediction
        'a=p[y]*2+1',

        // stretch
        'a=Math.log2(a/(h-a))',

        // mix using the weighted sum
        'm-=w[i]*a',

        // stash the stretched prediction premultiplied by the learning rate for the update step
        `a/${recipLearningRate}`,
      ].join(',')
    }))`,

    // squash
    'm=~-h/(1+2**m)|1',

    // pull a single bit out of the rANS state
    'v=s%h<m',

    // update the rANS state
    `s=s%h+(v?m:h-m)*(s>>${precision + 1})-!v*m`,

    // for each model,
    `f.map((y,i)=>(${
      [
        // update the prediction, using the stretched prediction stashed above
        `p[y]+=(v*${pow2(precision, precision)}-p[y]<<${deltaShift})/((d[y]+=d[y]<${modelMaxCount})+${baseCountLiteral(modelRecipBaseCount)})>>${deltaShift}`,

        // update the weight of the model
        `w[i]+=e[i]*(v-m/h)`,
      ].join(',')
    }))`,

    // shift in the decoded bit
    'n=n*2+v',
  ].join(',');

  // list of selectors, e.g. "0,1,2,12,23,..."
  const selectors = params.sparseSelectors.map((selector) => {
    const offsets = [];
    for (let j = 0; 1 << j <= selector; j++) {
      if (selector >> j & 1) { offsets.push(j + 1); }
    }
    return offsets.join('') || '0';
  }).join(',');

  // put the quote state into the context hash
  const quoteOffset = quotes.length === 0
    ? ''
    : quotes.length === 1
      ? '+g*129'
      : '+!!g*129';

  // calculate the context hash for each model
  const thirdInit = [
    // reset the mixed prediction
    'm=0',

    // for each model,
    `f=[${selectors}].map((y,i)=>(${
      [
        // reset the hash accumulator
        'a=0',

        // for each offset in the selector, hash the recent bytes into a context
        // 997 is a magic number borrowed from Roadroller
        '[...y+\'\'].map(y=>a=~(~o[l-y]+a)*997)',

        // combine the context with the bit context and quote state, then mask to the context size
        `${pow2(contextBits, precision)}-1&a+n${quoteOffset}`,
      ].join(',')

    // scale and offset it by the model index to get the final index
    })*${numModels}+i)`,
  ].join(',');

  // check if the rANS state needs to be renormalized
  const thirdCond = `s<${pow2(ANS_BITS - OUT_BITS, precision)}`;

  // if so, output a byte and read another one
  const thirdAfter = `s=s*${OUT_SYMBOLS}|A[r++]`;

  const body = [
    `for(;${firstCond};${firstAfter})`,
    `for(${secondInit};${secondCond};${secondAfter})`,
    `for(${thirdInit};${thirdCond};${thirdAfter});`,
  ].join('');

  // if the input is 7-bit ASCII and not too long as spreading arguments,
  // we can use `String.fromCharCode(...o)` which is shorter than `new TextDecoder().decode(o)`
  const stringify = inBits === 7 && inputLength < 65000
    ? `String.fromCharCode(...o)`
    : `new TextDecoder().decode(o)`;

  const tail = evalResult ? `eval?.(${stringify})` : `return ${stringify}`;

  return `(${args})=>{${body}${tail}}`;
}
