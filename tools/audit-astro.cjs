"use strict";
const fs = require('node:fs');
const path = require('node:path');
const { collectLanguagePosts, isPublished, validDate } = require('./content-records');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '..');
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
    articleCount++;
  }
  const projects = yaml.load(fs.readFileSync(path.join(root, 'data', lang, 'projects.yml'), 'utf8'));
  const home = fs.readFileSync(path.join(root, 'astro-dist', lang, 'index.html'), 'utf8');
  for (const marker of ['mimo-home-art', 'mimo-art-dots', 'mimo-art-word', 'hub-quick-grid', '/theme/style.css', 'personal-hub-navbar']) {
    if (!home.includes(marker)) throw new Error(`Missing original visual element in ${lang}: ${marker}`);
  }
  const projectHtml = fs.readFileSync(path.join(root, 'astro-dist', lang, 'projects', 'index.html'), 'utf8');
  if (!projectHtml.includes('workspace-sidebar') || !projectHtml.includes('project-workspace-grid')) throw new Error(`Original project layout missing: ${lang}`);
  if (projectHtml.match(/<h3>(.*?)<\/h3>/)?.[1] !== projects[0].title) throw new Error(`Original project ordering changed: ${lang}`);
  for (const project of projects) {
    const url = new URL(project.post, `https://chenfukun.space/${lang}/projects/`).pathname;
    if (!available.some((post) => post.url === url)) throw new Error(`Broken project reference: ${project.key}: ${url}`);
  }
  for (const page of ['projects', 'archives', 'notes', 'tools', 'experience', 'resume', 'about']) {
    if (!fs.existsSync(path.join(root, 'astro-dist', lang, page, 'index.html'))) throw new Error(`Missing ${lang}/${page}`);
  }
}
for (const asset of ['theme/style.css', 'theme/tailwind.css', 'theme/images/稻田鼠.jpg', 'theme/js/Swup.min.js', 'theme/js/SwupSlideTheme.min.js']) {
  if (!fs.existsSync(path.join(root, 'astro-dist', asset))) throw new Error(`Missing original theme asset: ${asset}`);
}
console.log(`[astro audit] ${articleCount} articles, bilingual project pages and project references passed.`);
