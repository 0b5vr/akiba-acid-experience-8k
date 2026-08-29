/**
 * Compresses the given text using Zopfli's deflate algorithm.
 *
 * @param text The text to compress.
 * @returns A `Promise<Uint8Array>` of the compressed data.
 */
export async function compressZopfli(text: string): Promise<Uint8Array> {
  const tmp = await Deno.makeTempFile();
  try {
    await Deno.writeTextFile(tmp, text);
    const out = await new Deno.Command('zopfli', {
      args: ['-c', '-i200', '--deflate', tmp],
      stdout: 'piped',
      stderr: 'null',
    }).output();
    return out.stdout;
  } finally {
    await Deno.remove(tmp);
  }
}
