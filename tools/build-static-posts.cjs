"use strict";

/**
 * 把已发布文章渲染成独立的 LAB 风格 HTML 文件，写入
 * astro-src/pages/{lang}/posts/<slug>/index.html（Astro 原生静态页，构建时输出到同名 URL）。
 *
 * 正文取自本地开发服务器渲染出的 .astro-prose 内容（需先 npm run dev，
 * 且 [...path].astro 尚未移除文章路由时的渲染结果）。
 * 已存在的目标文件会被跳过，便于手工维护单篇文章。
 *
 * 用法：node tools/build-static-posts.cjs [baseUrl]
 *   baseUrl 默认 http://127.0.0.1:4321
 */

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const { collectLanguagePosts, isPublished, validDate } = require("./content-records");

const ROOT = path.resolve(__dirname, "..");
// 独立文章 HTML 作为 Astro 原生静态页存放于 src/pages/{lang}/posts/<slug>/index.html
const OUT_ROOT = path.join(ROOT, "astro-src", "pages");
const ORIGIN = "https://edgeone.chenfukun.space";
const BASE = (process.argv[2] || process.env.POSTS_BASE || "http://127.0.0.1:4321").replace(/\/$/, "");

const DOMAIN_LABELS = {
  embedded: { "zh-CN": "嵌入式", en: "Embedded" },
  server: { "zh-CN": "服务器", en: "Server" },
  software: { "zh-CN": "软件", en: "Software" },
  research: { "zh-CN": "研究", en: "Research" },
  web: { "zh-CN": "网站", en: "Web" },
};

const SITE = {
  "zh-CN": { siteName: "稻田鼠", brand: "稻田鼠 · LAB NOTES", list: "文章列表", back: "← 返回项目", offline: "可离线使用" },
};

const css = fs.readFileSync(path.join(__dirname, "static-post.css"), "utf8");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function projectSlugs(language) {
  const file = path.join(ROOT, "data", language, "projects.yml");
  const list = yaml.load(fs.readFileSync(file, "utf8")) || [];
  return new Set(list.map((project) => String(project.post || "")
    .replace(/^\.\.\/posts\//, "").replace(/\/+$/, "")));
}

async function fetchProse(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const html = await response.text();
  const bodyMark = '<div class="astro-article-body">';
  const bodyAt = html.indexOf(bodyMark);
  if (bodyAt < 0) throw new Error(`${url}: 未找到 astro-article-body（文章可能已不是 Astro 渲染）`);
  const proseMatch = /<div class="astro-prose">/.exec(html.slice(bodyAt));
  if (!proseMatch) throw new Error(`${url}: 未找到 astro-prose`);
  const start = bodyAt + proseMatch.index + proseMatch[0].length;
  const tags = /<div\b|<\/div>/g;
  tags.lastIndex = start;
  let depth = 1;
  let match;
  let end = -1;
  while ((match = tags.exec(html))) {
    if (match[0] === "</div>") {
      depth -= 1;
      if (depth === 0) { end = match.index; break; }
    } else depth += 1;
  }
  if (end < 0) throw new Error(`${url}: astro-prose 闭合标签缺失`);
  const prose = html.slice(start, end).trim();
  if (!prose) throw new Error(`${url}: 正文为空`);
  return prose;
}

function splitSections(prose) {
  return prose.split(/(?=<h2[\s>])/).map((part) => part.trim()).filter(Boolean);
}

function buildHtml(record, prose) {
  const language = record.language;
  const site = SITE[language];
  const slug = record.slug;
  const url = record.url;
  const canonical = `${ORIGIN}${url}`;
  const title = record.data.title || slug;
  const description = record.data.description || "";
  const date = validDate(record.data.date);
  const updated = record.data.updated ? validDate(record.data.updated) : null;
  const modified = updated || date;
  const shareTitle = `${title} · ${site.siteName}`;
  const isProject = projectSlugs(language).has(slug);
  const robots = isProject ? "index,follow" : "noindex,follow";
  const categories = (record.data.categories || []).map((name) => DOMAIN_LABELS[name]?.[language] || name);
  const tags = record.data.tags || [];
  const chips = [...categories, ...tags];
  const dateStr = date ? date.toISOString().slice(0, 10) : "";
  const eyebrowParts = [...categories, dateStr].filter(Boolean).map(esc).join(" · ");
  const ogImage = `${ORIGIN}/scenes/gallery-mountain.webp`;
  const ogLocale = language === "zh-CN" ? "zh_CN" : "en_US";
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    name: title,
    description,
    url: canonical,
    inLanguage: language,
    author: { "@type": "Person", name: "陈富坤" },
    datePublished: date ? date.toISOString() : undefined,
    dateModified: modified ? modified.toISOString() : undefined,
  };
  const sections = splitSections(prose).map((part) =>
    `<section class="section lab-post-section"><div class="astro-prose lab-post-body">${part}</div></section>`).join("\n");

  return `<!doctype html>
<html lang="${language}" class="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · 稻田鼠</title><meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="${language}" href="${canonical}"><link rel="alternate" hreflang="x-default" href="${ORIGIN}/zh-CN/">
<meta property="og:type" content="article"><meta property="og:site_name" content="${esc(site.siteName)}">
<meta property="og:title" content="${esc(shareTitle)}"><meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}"><meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1920"><meta property="og:image:height" content="1080"><meta property="og:image:alt" content="${esc(title)}">
<meta property="og:locale" content="${ogLocale}">
${date ? `<meta property="article:published_time" content="${date.toISOString()}">\n` : ""}${modified ? `<meta property="article:modified_time" content="${modified.toISOString()}">\n` : ""}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(shareTitle)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${ogImage}">
<link rel="alternate" type="application/rss+xml" title="RSS" href="/${language}/feed.xml">
<link rel="manifest" href="/${language}/manifest.webmanifest"><link rel="icon" href="/icons/稻田鼠.jpg" type="image/jpeg">
<script type="application/ld+json" data-edgeone-schema>${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
<script>if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) { window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js', { scope: '/', updateViaCache: 'none' }).catch(console.error), { once: true }); }</script>
<style>${css}</style></head><body>
<header class="top"><div class="container nav">
  <a class="brand" href="/${language}/">${site.brand}</a>
  <nav class="nav-links" aria-label="页面导航">
    <a href="/${language}/archives/">${site.list}</a>
    ${isProject ? `<a class="scenic-project-back" href="/${language}/projects/">${site.back}</a>` : ""}
    <a href="https://github.com/FukunHennan" rel="noopener me">GitHub</a>
  </nav>
</div></header>
<div class="hero lab-post-hero"><div class="container">
  <p class="eyebrow">${eyebrowParts}</p>
  <h1>${esc(title)}</h1>
  <p class="lead">${esc(description)}</p>
  <div class="chips">${chips.map((chip) => `<span class="chip">${esc(chip)}</span>`).join("")}</div>
</div></div>
<main class="container article lab-post">
${sections}
</main>
<footer class="container footer">${site.brand} <span class="pill">${site.offline}</span> &nbsp;|&nbsp; <a href="https://github.com/FukunHennan/edgeone-page">GitHub</a></footer>
</body></html>
`;
}

async function main() {
  let written = 0;
  let skipped = 0;
  for (const language of ["zh-CN"]) {
    const records = collectLanguagePosts(language)
      .filter((record) => isPublished(record.data) && validDate(record.data.date) && validDate(record.data.date) <= new Date());
    for (const record of records) {
      const target = path.join(OUT_ROOT, language, "posts", `${record.slug}.html`);
      // 与 public 目录约定一致：以 .../posts/<slug>/index.html 形式输出
      const targetDir = path.join(OUT_ROOT, language, "posts", record.slug);
      const targetFile = path.join(targetDir, "index.html");
      void target;
      if (fs.existsSync(targetFile)) {
        skipped += 1;
        console.log(`[skip] ${language}/${record.slug}`);
        continue;
      }
      const prose = await fetchProse(`${BASE}${record.url}`);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetFile, buildHtml(record, prose), "utf8");
      written += 1;
      console.log(`[write] ${targetFile}`);
    }
  }
  console.log(`[static-posts] written=${written} skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
