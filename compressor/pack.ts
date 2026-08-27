import type { CompressionParams } from './CompressionParams.ts';
import { encode, stateBytes } from './encode.ts';
import { buildDecoder } from './buildDecoder.ts';
import { compressZopfli } from './deflate/compressZopfli.ts';
import { cloneCompressionParams } from './utils/cloneCompressionParams.ts';

export interface PackResult {
  /** The parameters used to pack this. */
  params: CompressionParams;

  /** The header bytes of the self-extracting HTML file. */
  headerBytes: Uint8Array;

  /** The rANS-encoded bytes of the payload. */
  data: Uint8Array;

  /** The deflated JS source of the rANS decoder. */
  trailer: Uint8Array;

  /**
   * The read offset baked into the decoder.
   * Verifier will use this to skip the header and read the data.
   */
  skip: number;

  /** The total size of the self-extracting HTML file. */
  size: number;
}

/**
 * Pack the given input into a self-extracting HTML file, using the given compression parameters.
 *
 * The html file has the following layout:
 *
 * - header decoder: An SVG with an `onload` that fetches the rest of the file, extracts the
 *   deflated decoder, runs it.
 * - data: The rANS-encoded bytes of the payload.
 * - deflated decoder: The deflated JS source of the rANS decoder.
 */
export async function pack(
  input: Uint8Array,
  inBits: number,
  params: CompressionParams,
): Promise<PackResult> {
  const { state, buf, quotesSeen } = encode(input, inBits, params);
  const data = Uint8Array.from([...stateBytes(state), ...buf]);

  const makeHeader = (trailerLength: number) => {
    /* eslint-disable */
    const code = '' +
      '<svg onload="' +
        'fetch``' +
          '.then(t=>t.bytes())' +
          '.then(t=>new Response(' +
            `new Response(t.slice(-${trailerLength})).body.pipeThrough(` +
              'new DecompressionStream("deflate-raw")' +
            ')'
          ').text().then(s=>eval?.(s)(t)))' +
      '">';
    /* eslint-enable */

    return new TextEncoder().encode(code);
  };

  // The header and footer embed the length of the other, so we have to iterate until they converge
  let skip = 0;
  for (let i = 0; i < 8; i++) {
    const decoder = buildDecoder(params, input.length, inBits, quotesSeen, skip, true);
    const trailer = await compressZopfli(decoder);
    const headerBytes = makeHeader(trailer.length);

    if (headerBytes.length === skip) {
      return {
        params: cloneCompressionParams(params),
        headerBytes,
        data,
        trailer,
        skip,
        size: headerBytes.length + data.length + trailer.length,
      };
    }
    skip = headerBytes.length;
  }

  throw new Error('pack: the header length did not converge');
}
