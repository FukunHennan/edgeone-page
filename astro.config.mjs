import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
// 用 Node 原生 CJS 加载器读取主题脚本：Vite 8 的模块运行器会以 ESM 求值 .cjs，
// 使脚本内的 require 变成 undefined，导致 astro build 偶然报 "require is not defined"。
const nodeRequire = createRequire(import.meta.url);
const themeAssets = nodeRequire('./tools/astro-theme.cjs');
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
