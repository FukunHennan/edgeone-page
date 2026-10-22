"use strict";
const fs = require('node:fs');
const path = require('node:path');
const { collectLanguagePosts, isPublished, validDate } = require('./content-records');
const yaml = require('js-yaml');
const { slugize } = require('hexo-util');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'astro-dist');
const origin = 'https://edgeone.chenfukun.space';
const config = JSON.parse(fs.readFileSync(path.join(root, 'edgeone.json'), 'utf8'));
if (config.buildCommand !== 'npm run build:production' || config.outputDirectory !== 'astro-dist') {
  throw new Error('EdgeOne must build and publish the Astro output.');
}
if (config.redirects.some(({ source }) => /\/(?:tags|categories)\/\*/.test(source) || /\/archives\/\d{4}\/\*/.test(source))) {
  throw new Error('A broad redirect hides an Astro taxonomy or dated archive page.');
}
let articleCount = 0;
for (const lang of ['zh-CN', 'en']) {
  const available = collectLanguagePosts(lang).filter((post) => isPublished(post.data) && validDate(post.data.date) <= new Date());
  for (const post of available) {
    const target = path.join(root, 'astro-dist', post.url, 'index.html');
    if (!fs.existsSync(target)) throw new Error(`Missing article: ${post.url}`);
    const html = fs.readFileSync(target, 'utf8');
    if (!html.includes(`lang="${lang}"`) || !html.includes('rel="canonical"') || !html.includes('hreflang=')) {
      throw new Error(`Missing language or SEO metadata: ${post.url}`);
    }
    if (!html.includes(`${origin}${post.url}`) || !html.includes('"@type":"BlogPosting"')) {
      throw new Error(`Missing production canonical or article schema: ${post.url}`);
    }
    articleCount++;
  }
  for (const kind of ['categories', 'tags']) {
    const index = path.join(output, lang, kind, 'index.html');
    if (!fs.existsSync(index)) throw new Error(`Missing ${lang}/${kind} index`);
    for (const post of available) for (const term of post.data[kind]) {
      const slug = slugize(String(term), { transform: 1 });
      const termPage = path.join(output, lang, kind, slug, 'index.html');
      if (!fs.existsSync(termPage)) throw new Error(`Missing ${lang}/${kind}/${slug}`);
      if (!fs.readFileSync(termPage, 'utf8').includes(post.data.title)) {
        throw new Error(`Article missing from ${lang}/${kind}/${slug}: ${post.relativePath}`);
      }
    }
  }
  for (const post of available) {
    const date = validDate(post.data.date).toISOString();
    for (const period of [date.slice(0, 4), `${date.slice(0, 4)}/${date.slice(5, 7)}`]) {
      const archive = path.join(output, lang, 'archives', period, 'index.html');
      if (!fs.existsSync(archive) || !fs.readFileSync(archive, 'utf8').includes(post.data.title)) {
        throw new Error(`Missing article from dated archive: ${lang}/${period}: ${post.relativePath}`);
      }
    }
  }
  for (const asset of ['feed.xml', 'sitemap.xml', 'manifest.webmanifest', 'offline.html', '404.html', 'search.json']) {
    if (!fs.existsSync(path.join(output, lang, asset))) throw new Error(`Missing ${lang}/${asset}`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(output, lang, 'manifest.webmanifest'), 'utf8'));
  if (manifest.lang !== lang || manifest.start_url !== `/${lang}/`) throw new Error(`Invalid ${lang} manifest`);
  const feed = fs.readFileSync(path.join(output, lang, 'feed.xml'), 'utf8');
  if ((feed.match(/<item>/g) || []).length !== Math.min(available.length, 30)) throw new Error(`Invalid ${lang} RSS feed`);
  const projects = yaml.load(fs.readFileSync(path.join(root, 'data', lang, 'projects.yml'), 'utf8'));
  const home = fs.readFileSync(path.join(root, 'astro-dist', lang, 'index.html'), 'utf8');
  // The homepage intentionally replaces the old dense dashboard with a quiet gallery.
  for (const marker of ['calm-home', 'data-calm-slide', 'data-calm-dot', 'data-calm-pause', '/scenes/mountain-lake.svg', '/theme/style.css', 'personal-hub-navbar']) {
    if (!home.includes(marker)) throw new Error(`Missing calm homepage element in ${lang}: ${marker}`);
  }
  for (const marker of ['data-calm-video', 'data-video-src', 'mixkit.co/videos/preview/', 'calm-poster', 'hub-language-select']) {
    if (!home.includes(marker)) throw new Error(`Missing live scenery or header language selection: ${lang}: ${marker}`);
  }
  if (home.includes('class="astro-language"') || home.includes('class="lang-select lang-select-mobile"')) {
    throw new Error(`A language switch is incorrectly placed outside the header: ${lang}`);
  }
  if (home.includes('hub-quick-grid') || home.includes('hub-dashboard-grid')) {
    throw new Error(`Legacy dashboard leaked into the calm homepage: ${lang}`);
  }
  const projectHtml = fs.readFileSync(path.join(root, 'astro-dist', lang, 'projects', 'index.html'), 'utf8');
  if (!projectHtml.includes('workspace-sidebar') || !projectHtml.includes('project-workspace-grid')) throw new Error(`Original project layout missing: ${lang}`);
  if (projectHtml.match(/<h3>(.*?)<\/h3>/)?.[1] !== projects[0].title) throw new Error(`Original project ordering changed: ${lang}`);
  for (const project of projects) {
    const url = new URL(project.post, `https://chenfukun.space/${lang}/projects/`).pathname;
    if (!available.some((post) => post.url === url)) throw new Error(`Broken project reference: ${project.key}: ${url}`);
  }
  for (const page of ['projects', 'archives', 'notes', 'experience', 'resume', 'about']) {
    if (!fs.existsSync(path.join(root, 'astro-dist', lang, page, 'index.html'))) throw new Error(`Missing ${lang}/${page}`);
  }
}
for (const asset of ['scenes/mountain-lake.svg', 'scenes/soft-coast.svg', 'scenes/green-meadow.svg', 'scenes/misty-forest.svg']) {
  if (!fs.existsSync(path.join(output, asset))) throw new Error(`Missing homepage scene asset: ${asset}`);
}
for (const asset of ['theme/style.css', 'theme/tailwind.css', 'theme/images/稻田鼠.jpg', 'theme/js/Swup.min.js', 'theme/js/SwupSlideTheme.min.js']) {
  if (!fs.existsSync(path.join(root, 'astro-dist', asset))) throw new Error(`Missing original theme asset: ${asset}`);
}
for (const asset of ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'service-worker.js', 'icons/稻田鼠.jpg', 'language-manifest.json']) {
  if (!fs.existsSync(path.join(output, asset))) throw new Error(`Missing production asset: ${asset}`);
}
const robots = fs.readFileSync(path.join(output, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`) || robots.includes('Disallow: /')) throw new Error('Production robots.txt blocks indexing');
const worker = fs.readFileSync(path.join(output, 'service-worker.js'), 'utf8');
if (!worker.includes('edgeone-page-') || worker.includes('Date.now')) throw new Error('Service worker cache version is unstable');
console.log(`[astro audit] ${articleCount} articles, bilingual project pages and project references passed.`);
