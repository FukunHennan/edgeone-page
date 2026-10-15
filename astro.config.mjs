import { defineConfig } from 'astro/config';
import themeAssets from './tools/astro-theme.cjs';
themeAssets.prepareTheme();

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 12)) {
  throw new Error('Astro requires Node.js >=22.12. Use the version pinned in .node-version.');
}

export default defineConfig({
  site: 'https://chenfukun.space',
  srcDir: './astro-src',
  publicDir: './astro-static',
  outDir: './astro-dist',
  output: 'static',
  trailingSlash: 'always',
});
