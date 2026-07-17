"use strict";

const fs = require("fs");
const path = require("path");
const {
  LANGUAGE_CODES,
  PROJECT_ROOT,
  collectLanguagePosts,
  validDate,
} = require("./content-records");

const PUBLIC = path.join(PROJECT_ROOT, "public");
const ORIGIN = "https://edgeone-page.edgeone.app";
const LOCALES = {
  "zh-CN": {
    title: "EdgeOne Page",
    description: "面向腾讯云 EdgeOne Pages 的简体中文和英文双语站点。",
    notFound: "页面未找到",
    message: "你访问的页面不存在或已经移动。",
    home: "返回中文首页",
  },
  en: {
    title: "EdgeOne Page",
    description: "A Simplified Chinese and English Hexo site optimized for Tencent EdgeOne Pages.",
    notFound: "Page not found",
    message: "The page you requested does not exist or has moved.",
    home: "Back to English home",
  },
};

const mkdir = (directory) => fs.mkdirSync(directory, { recursive: true });
const escapeXml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&apos;");
const escapeHtml = (value) => escapeXml(value).replace(/&apos;/g, "&#39;");

function walk(directory, predicate) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(target, predicate));
    else if (entry.isFile() && predicate(target)) files.push(target);
  }
  return files.sort();
}

function publishedPosts(language) {
  return collectLanguagePosts(language)
    .filter((record) => record.published)
    .map((record) => {
      const date = validDate(record.data.date);
      const updated = validDate(record.data.updated || record.data.date);
      if (!date || !updated) throw new Error(`${record.filePath}: published article requires valid dates`);
      return {
        title: String(record.data.title),
        description: String(record.data.description || record.body.slice(0, 220)),
        content: record.body,
        date,
        updated,
        url: record.url,
        absoluteUrl: `${ORIGIN}${record.url}`,
        tags: Array.isArray(record.data.tags) ? record.data.tags.map(String) : [],
      };
    })
    .sort((left, right) => right.date - left.date);
}

function latestDate(posts) {
  if (!posts.length) return new Date(0);
  return new Date(Math.max(...posts.map((post) => post.updated.getTime())));
}

function writeSearch(language, posts) {
  mkdir(path.join(PUBLIC, language));
  const payload = posts.map(({ title, description, content, url, tags }) => ({
    title,
    description,
    content,
    url,
    tags,
  }));
  fs.writeFileSync(path.join(PUBLIC, language, "search.json"), `${JSON.stringify(payload)}\n`, "utf8");
}

function writeFeed(language, posts) {
  const locale = LOCALES[language];
  const feedUrl = `${ORIGIN}/${language}/feed.xml`;
  const items = posts.slice(0, 30).map((post) => `    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${escapeXml(post.absoluteUrl)}</link>\n      <guid isPermaLink="true">${escapeXml(post.absoluteUrl)}</guid>\n      <pubDate>${post.date.toUTCString()}</pubDate>\n      <description>${escapeXml(post.description)}</description>\n    </item>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${escapeXml(locale.title)}</title>\n    <link>${ORIGIN}/${language}/</link>\n    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>\n    <description>${escapeXml(locale.description)}</description>\n    <language>${language}</language>\n    <lastBuildDate>${latestDate(posts).toUTCString()}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`;
  fs.writeFileSync(path.join(PUBLIC, language, "feed.xml"), xml, "utf8");
}

function htmlFiles(language) {
  return walk(path.join(PUBLIC, language), (file) => file.endsWith(".html"));
}

function htmlUrl(language, file) {
  const base = path.join(PUBLIC, language);
  const relative = path.relative(base, file).split(path.sep).join("/");
  if (relative === "index.html") return `/${language}/`;
  if (relative.endsWith("/index.html")) return `/${language}/${relative.slice(0, -10)}`;
  return `/${language}/${relative}`;
}

function write404() {
  for (const [language, locale] of Object.entries(LOCALES)) {
    const font = language === "en"
      ? '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
      : '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",system-ui,sans-serif';
    const html = `<!doctype html>\n<html lang="${language}">\n<head>\n<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow">\n<title>${escapeHtml(locale.notFound)} | ${escapeHtml(locale.title)}</title>\n<style>:root{color-scheme:light dark;font-family:${font}}body{min-height:100vh;margin:0;display:grid;place-items:center;background:#f8fafc;color:#0f172a}main{max-width:640px;padding:48px;text-align:center}h1{font-size:clamp(5rem,20vw,10rem);margin:0;color:#2563eb}h2{font-size:2rem;margin:.5rem 0}p{color:#64748b;line-height:1.8}a{display:inline-block;margin-top:1rem;padding:.8rem 1.2rem;border-radius:.75rem;background:#2563eb;color:#fff;text-decoration:none}@media(prefers-color-scheme:dark){body{background:#020617;color:#e2e8f0}p{color:#94a3b8}}</style>\n</head>\n<body><main><h1>404</h1><h2>${escapeHtml(locale.notFound)}</h2><p>${escapeHtml(locale.message)}</p><a href="/${language}/">${escapeHtml(locale.home)}</a></main></body>\n</html>\n`;
    fs.writeFileSync(path.join(PUBLIC, language, "404.html"), html, "utf8");
  }
  const root404 = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 | EdgeOne Page</title><script>(()=>{let saved=null;try{saved=localStorage.getItem("EDGEONE-LANG")}catch(_){}const lang=saved==="en"||(!saved&&!(navigator.language||"").toLowerCase().startsWith("zh"))?"en":"zh-CN";location.replace("/"+lang+"/404.html")})()</script></head><body><a href="/zh-CN/404.html">简体中文</a> · <a href="/en/404.html">English</a></body></html>';
  fs.writeFileSync(path.join(PUBLIC, "404.html"), root404, "utf8");
}

function injectAlternates() {
  for (const language of LANGUAGE_CODES) {
    const other = language === "zh-CN" ? "en" : "zh-CN";
    const currentRoot = path.join(PUBLIC, language);
    const otherRoot = path.join(PUBLIC, other);
    for (const file of htmlFiles(language)) {
      const relative = path.relative(currentRoot, file);
      const counterpart = path.join(otherRoot, relative);
      if (!fs.existsSync(counterpart)) continue;
      let html = fs.readFileSync(file, "utf8");
      if (html.includes('hreflang="zh-CN"')) continue;
      const currentUrl = `${ORIGIN}${htmlUrl(language, file)}`;
      const otherUrl = `${ORIGIN}${htmlUrl(other, counterpart)}`;
      const zhUrl = language === "zh-CN" ? currentUrl : otherUrl;
      const enUrl = language === "en" ? currentUrl : otherUrl;
      const tags = `\n<link rel="alternate" hreflang="zh-CN" href="${zhUrl}">\n<link rel="alternate" hreflang="en" href="${enUrl}">\n<link rel="alternate" hreflang="x-default" href="${zhUrl}">`;
      html = html.replace("</head>", `${tags}\n</head>`);
      fs.writeFileSync(file, html, "utf8");
    }
  }
}

function writeSitemaps(postsByLanguage) {
  for (const language of LANGUAGE_CODES) {
    const posts = postsByLanguage[language];
    const fallback = latestDate(posts).toISOString();
    const urls = new Map();
    for (const file of htmlFiles(language)) {
      if (/\/(?:404|offline)\.html$/i.test(file)) continue;
      urls.set(`${ORIGIN}${htmlUrl(language, file)}`, fallback);
    }
    for (const post of posts) urls.set(post.absoluteUrl, post.updated.toISOString());
    const body = [...urls.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([url, lastmod]) => `  <url><loc>${escapeXml(url)}</loc><lastmod>${lastmod}</lastmod></url>`)
      .join("\n");
    fs.writeFileSync(path.join(PUBLIC, language, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, "utf8");
  }
  fs.writeFileSync(path.join(PUBLIC, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${ORIGIN}/zh-CN/sitemap.xml</loc></sitemap>\n  <sitemap><loc>${ORIGIN}/en/sitemap.xml</loc></sitemap>\n</sitemapindex>\n`, "utf8");
  fs.writeFileSync(path.join(PUBLIC, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`, "utf8");
}

function verify() {
  const required = [
    "robots.txt", "sitemap.xml", "404.html",
    "zh-CN/search.json", "en/search.json",
    "zh-CN/feed.xml", "en/feed.xml",
    "zh-CN/sitemap.xml", "en/sitemap.xml",
    "zh-CN/404.html", "en/404.html",
  ];
  for (const relative of required) {
    if (!fs.existsSync(path.join(PUBLIC, relative))) throw new Error(`Missing public/${relative}`);
  }
}

function postprocessBilingualSite() {
  mkdir(PUBLIC);
  const posts = {};
  for (const language of LANGUAGE_CODES) {
    posts[language] = publishedPosts(language);
    writeSearch(language, posts[language]);
    writeFeed(language, posts[language]);
  }
  write404();
  injectAlternates();
  writeSitemaps(posts);
  verify();
  return Object.fromEntries(Object.entries(posts).map(([language, list]) => [language, list.length]));
}

if (require.main === module) {
  try {
    const counts = postprocessBilingualSite();
    console.log(`[features] Generated published bilingual features: ${JSON.stringify(counts)}`);
  } catch (error) {
    console.error(`[features] ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { postprocessBilingualSite, publishedPosts };
