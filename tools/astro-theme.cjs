"use strict";
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const stylus = require('stylus');
const nib = require('nib');
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'themes/edg-one-page/source');

// ---------------------------------------------------------------------------
// 资源清单：这里是「哪些主题文件会进入构建产物」的唯一来源。
// 想增删主题资源时只改这里，不要在各处散落地写路径。
// 上游 themes/edg-one-page/source 目录本身保持完整，删掉的只是产物中的副本。
// ---------------------------------------------------------------------------

// 字体：subset.min.css 只声明了下面三个 @font-face，其余字重/风格没有任何
// 页面会请求，拷贝过去只会白白占部署体积（duotone/light/thin/sharp 合计 3.8MB）。
const WEBFONT_FILES = [
  'fa-solid-900.woff2',
  'fa-regular-400.woff2',
  'fa-brands-400.woff2',
];

// 图标样式表：只发布我们实际引用的一份子集，完整 Pro 样式表留在源目录备查。
const FONTAWESOME_FILES = ['subset.min.css'];

// 图片：只保留站点真正引用的资源。
const THEME_IMAGE_FILES = ['稻田鼠.jpg'];

// 注：source/fonts 下的 Chillax / Geist / GeistMono 不发布。
// Shell.astro 通过 define:vars 注入系统字体栈，没有任何 @font-face 指向它们，
// 浏览器实测也不会请求 theme/fonts/。

function copyFile(from, to) {
  if (!fs.existsSync(from)) throw new Error(`[astro-theme] 缺少资源: ${path.relative(ROOT, from)}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function prepareTheme() {
  const output = path.join(ROOT, 'astro-static/theme');
  // 每次重建前先清空，避免上一次构建留下的资源（例如已废弃的完整字体）
  // 继续滞留在产物里。
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  for (const name of WEBFONT_FILES) {
    copyFile(path.join(SOURCE, 'webfonts', name), path.join(output, 'webfonts', name));
  }
  for (const name of FONTAWESOME_FILES) {
    copyFile(path.join(SOURCE, 'fontawesome', name), path.join(output, 'fontawesome', name));
  }
  for (const name of THEME_IMAGE_FILES) {
    copyFile(path.join(SOURCE, 'images', name), path.join(output, 'images', name));
  }
  const config = yaml.load(fs.readFileSync(path.join(SOURCE, '../_config.yml'), 'utf8'));
  const file = path.join(SOURCE, 'css/style.styl');
  const css = stylus(fs.readFileSync(file, 'utf8')).use(nib())
    .define('hexo-config', (key) => key.val.split('.').reduce((value, part) => value?.[part], config) ?? '')
    .set('filename', file).set('include css', true).render();
  fs.writeFileSync(path.join(output, 'style.css'), css);
  fs.copyFileSync(path.join(SOURCE, 'css/build/tailwind.css'), path.join(output, 'tailwind.css'));
  fs.mkdirSync(path.join(output, 'js'), { recursive: true });
  for (const name of ['Swup', 'SwupSlideTheme', 'SwupProgressPlugin', 'SwupScrollPlugin', 'SwupPreloadPlugin']) {
    fs.copyFileSync(path.join(SOURCE, `js/libs/${name}.min.js`), path.join(output, `js/${name}.min.js`));
  }
  for (const lang of ['zh-CN', 'en']) {
    const dir = path.join(ROOT, 'astro-static', lang, 'js');
    fs.mkdirSync(dir, { recursive: true });
    // 简历页的打印/PDF 导出引用 ../js/libs/ 下这两个库；其余 libs 文件没有任何页面引用。
    const libs = path.join(dir, 'libs');
    fs.mkdirSync(libs, { recursive: true });
    for (const name of ['html2canvas-pro.min.js', 'jspdf.umd.min.js']) {
      fs.copyFileSync(path.join(SOURCE, 'js/libs', name), path.join(libs, name));
    }
  }
}
module.exports = { prepareTheme };
