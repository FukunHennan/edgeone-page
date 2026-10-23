import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import themeAssets from './tools/astro-theme.cjs';
const { nodeVersion } = JSON.parse(readFileSync(new URL('./edgeone.json', import.meta.url), 'utf8'));
const actual = process.versions.node.split('.').map(Number);
const minimum = nodeVersion.split('.').map(Number);
if (actual[0] !== minimum[0] || actual[1] < minimum[1] || (actual[1] === minimum[1] && actual[2] < minimum[2])) {
  throw new Error(`Use Node.js >=${nodeVersion} <${minimum[0] + 1}. Use the version pinned in .node-version.`);
}
themeAssets.prepareTheme();

export default defineConfig({
  site: 'https://edgeone.chenfukun.space',
  srcDir: './astro-src',
  publicDir: './astro-static',
  outDir: './astro-dist',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
