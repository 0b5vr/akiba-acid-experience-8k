import { Plugin } from 'vite';

const fileRegex = /\?html$/;

export interface HTMLMinifierPluginOptions {
  minify: boolean;
}

export const htmlMinifierPlugin: (
  options: HTMLMinifierPluginOptions,
) => Plugin = ({ minify }) => {
  return {
    name: 'html-minifier',
    enforce: 'pre',
    async transform(src: string, id: string) {
      if (fileRegex.test(id)) {
        if (!minify) {
          return `export default \`${src}\`;`;
        }

        // CRLF環境(core.autocrlf=true等)で\rが残ると、innerHTML挿入時に余計なTextノードが生まれてしまうため両方除去する
        const result = src.replaceAll('\r', '').replaceAll('\n', '');

        return {
          code: `export default \`${result}\`;`,
        };
      }
    },
  };
};
