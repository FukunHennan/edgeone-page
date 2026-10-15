"use strict";
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const stylus = require('stylus');
const nib = require('nib');
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'themes/edg-one-page/source');
function prepareTheme() {
  const output = path.join(ROOT, 'astro-static/theme');
  fs.mkdirSync(output, { recursive: true });
  for (const folder of ['images', 'fonts', 'fontawesome', 'webfonts']) {
    const from = path.join(SOURCE, folder);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(output, folder), { recursive: true });
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
    fs.copyFileSync(path.join(SOURCE, 'js/toolbox.js'), path.join(dir, 'toolbox.js'));
    fs.cpSync(path.join(SOURCE, 'js/libs'), path.join(dir, 'libs'), { recursive: true });
    fs.cpSync(path.join(SOURCE, 'js/libs'), path.join(dir, 'build/libs'), { recursive: true });
  }
}
module.exports = { prepareTheme };
