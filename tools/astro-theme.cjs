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

// 字体：发布 `assets/fa-subset/` 里已按图标裁剪过的版本，而不是上游完整字体。
// 上游 fa-solid/fa-regular 各有 3157 个字形、合计 812KB，本站只用 9 个图标；
// 裁剪后三套字体合计约 2.5KB。重新生成用 `npm run subset:icons`。
// 注意：不要改回 themes/…/source/webfonts —— 那是未裁剪的完整字体。
const WEBFONT_DIR = path.join(ROOT, 'assets/fa-subset');
const WEBFONT_FILES = [
  'fa-solid-900.woff2',
  'fa-regular-400.woff2',
  'fa-brands-400.woff2',
];

// 图标样式表：同样放在 WEBFONT_DIR，和字体是一对必须同步的搭档
// （CSS 里的 :before 码点 ↔ 字体里的字形）。上游完整 Pro 样式表留在
// themes/…/source/fontawesome 备查，不进产物。
const FONTAWESOME_FILE = 'subset.min.css';

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
    copyFile(path.join(WEBFONT_DIR, name), path.join(output, 'webfonts', name));
  }
  copyFile(path.join(WEBFONT_DIR, FONTAWESOME_FILE), path.join(output, 'fontawesome', FONTAWESOME_FILE));
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
