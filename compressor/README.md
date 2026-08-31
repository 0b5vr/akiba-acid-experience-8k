# compressor

This folder contains a tentative implementation of a JS compressor.
Like [compeko](https://gist.github.com/0b5vr/09ee96ca2efbe5bf9d64dad7220e923b), this module compresses JS code into a self-extracting HTML file.
This time, the compressor uses [context mixing](https://en.wikipedia.org/wiki/Context_mixing) and [rANS](https://en.wikipedia.org/wiki/Asymmetric_numeral_systems) to achieve better compression ratios than compeko, at the cost of a more complex implementation.

## Prerequisites

- [Deno](https://deno.com/)
- [Zopfli](https://github.com/google/zopfli)

## Usage

```sh
deno run --allow-read --allow-write --allow-run compressor/index.ts input.js output.html
```

## Shoutouts

- gasman, for [pnginator](https://gist.github.com/gasman/2560551)
- Charles Boccato, for [JsExe](https://www.pouet.net/prod.php?which=59298)
- subzey, for [fetchcrunch](https://github.com/subzey/fetchcrunch)
- Mentor and Blueberry, for [Crinkler](https://github.com/runestubbe/Crinkler)
- Kang Seonghoon, for [Roadroller](https://github.com/lifthrasiir/roadroller)
