# js-4k-template

A simple TypeScript 4kb WebGL intro template?

## Prerequisites

- [Node.js](https://nodejs.org)
- [pnpm](https://pnpm.io)
- [Deno](https://deno.land)
- [Shader Minifier](https://github.com/laurentlb/shader-minifier)
- [Zopfli](https://github.com/google/zopfli)

## Build

```sh
pnpm install
pnpm build
```

## Development

```sh
pnpm install
pnpm dev
```

### Controls

These keyboard controls are available in the dev build:

- `Space`: pause / resume
- `←` / `→`: seek by 5s
- `Shift` + `←` / `→`: seek by 60s
- `Alt` + `←` / `→`: seek by one frame
- `Home`: jump to the beginning
- `End`: jump to the end

### How to add a new scene

To add a new scene:

- Place a `.frag` under `/src/programs/assets`.
- Add a type definition entry to `/src/programs/programs.ts`
- Add an import and a compilation entry in `/src/programs/loadPrograms.ts`

## License

[CC BY-NC 4.0](./LICENSE)
