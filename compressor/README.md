# compressor

This folder contains a tentative implementation of a JS compressor.
Like [compeko](https://gist.github.com/0b5vr/09ee96ca2efbe5bf9d64dad7220e923b), this module compresses JS code into a self-extracting HTML file.
This time, the compressor uses [context mixing](https://en.wikipedia.org/wiki/Context_mixing) and [rANS](https://en.wikipedia.org/wiki/Asymmetric_numeral_systems) to achieve better compression ratios than compeko, at the cost of a more complex implementation.

## Prerequisites

- [Deno](https://deno.com/)
- [Zopfli](https://github.com/google/zopfli)

## Usage

Specify the input JS file (will be fed into eval) and the output HTML file.

```sh
deno run --allow-read --allow-write --allow-run compressor/index.ts input.js output.html
```

### Optimization

Pass `-O<level>` (0-2, default 0) to search for better compression parameters.
`-O1` only tries a few presets and anneals the sparse selectors briefly, while `-O2` does a full search and anneals longer.

Use `-P<path>` to specify a JSON file of parameters.
When combined with `-O`, the file is overwritten with the optimized parameters, so the next run without `-O` can reuse them.

```sh
# optimize once, and save the result
deno run --allow-read --allow-write --allow-run compressor/index.ts -O2 -P=params.json input.js output.html

# reuse the saved parameters
deno run --allow-read --allow-write --allow-run compressor/index.ts -P=params.json input.js output.html
```

### Size analysis

Pass `--analyze=<input.js.map>` to see how many bytes each source file costs after compression, using the sourcemap of the input.
`--analyze-order=name|size|appearance` changes the sort order of the table (default: `size`).

```sh
deno run --allow-read --allow-write --allow-run compressor/index.ts --analyze=input.js.map input.js output.html
```

## Shoutouts

- gasman, for [pnginator](https://gist.github.com/gasman/2560551)
- Charles Boccato, for [JsExe](https://www.pouet.net/prod.php?which=59298)
- subzey, for [fetchcrunch](https://github.com/subzey/fetchcrunch)
- Mentor and Blueberry, for [Crinkler](https://github.com/runestubbe/Crinkler)
- Kang Seonghoon, for [Roadroller](https://github.com/lifthrasiir/roadroller)
