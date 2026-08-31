/**
 * Returns whether the `zopfli` is available in the environment.
 */
export async function haveZopfli(): Promise<boolean> {
  try {
    await new Deno.Command('zopfli', { args: ['-h'], stdout: 'null', stderr: 'null' }).output();
    return true;
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) { throw e; }
    return false;
  }
}
