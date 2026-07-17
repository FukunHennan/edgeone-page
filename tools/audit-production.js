"use strict";

const fs = require("fs");
const path = require("path");
const { LANGUAGE_CODES, PROJECT_ROOT, collectLanguagePosts } = require("./content-records");

const PUBLIC = path.join(PROJECT_ROOT, "public");
const config = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "edgeone.json"), "utf8"));
const fail = (message) => { throw new Error(message); };
const exists = (relative) => fs.existsSync(path.join(PUBLIC, relative));
const read = (relative) => fs.readFileSync(path.join(PUBLIC, relative), "utf8");
const count = (value, pattern) => (value.match(pattern) || []).length;

if (config.installCommand !== "npm ci") fail("EdgeOne installCommand must remain npm ci");
if (config.buildCommand !== "npm run build:production") fail("Unexpected EdgeOne build command");
if (config.outputDirectory !== "public") fail("Unexpected EdgeOne output directory");
if (!/^20\./.test(String(config.nodeVersion))) fail("EdgeOne must use Node.js 20");

const languageManifest = JSON.parse(read("language-manifest.json"));
if (languageManifest.default !== "zh-CN" || JSON.stringify(languageManifest.supported) !== JSON.stringify(LANGUAGE_CODES)) {
  fail("language-manifest.json is inconsistent");
}

for (const language of LANGUAGE_CODES) {
  for (const relative of [
    `${language}/index.html`,
    `${language}/manifest.webmanifest`,
    `${language}/offline.html`,
    `${language}/feed.xml`,
    `${language}/sitemap.xml`,
    `${language}/search.json`,
  ]) {
    if (!exists(relative)) fail(`Missing public/${relative}`);
  }

  const manifest = JSON.parse(read(`${language}/manifest.webmanifest`));
  if (manifest.lang !== language || manifest.start_url !== `/${language}/` || manifest.scope !== `/${language}/`) {
    fail(`${language} manifest is inconsistent`);
  }

  const published = collectLanguagePosts(language).filter((record) => record.published);
  const search = JSON.parse(read(`${language}/search.json`));
  const feed = read(`${language}/feed.xml`);
  if (search.length !== published.length) fail(`${language} search index count does not match published posts`);
  if (count(feed, /<item>/g) !== published.length) fail(`${language} RSS count does not match published posts`);

  for (const record of published) {
    const relativeHtml = record.url.replace(/^\//, "").replace(/\/$/, "/index.html");
    if (!exists(relativeHtml)) fail(`Missing generated article: public/${relativeHtml}`);
    const html = read(relativeHtml);
    const checks = [
      [`lang=\"${language}\"`, html.includes(`lang="${language}"`)],
      ["BlogPosting JSON-LD", html.includes('"@type":"BlogPosting"')],
      ["canonical", html.includes('rel="canonical"')],
      ["zh-CN hreflang", html.includes('hreflang="zh-CN"')],
      ["en hreflang", html.includes('hreflang="en"')],
      ["manifest", html.includes('rel="manifest"')],
      ["service worker", html.includes("data-edgeone-service-worker")],
    ];
    for (const [label, passed] of checks) if (!passed) fail(`${relativeHtml} is missing ${label}`);
    if (count(html, /<meta\s+name=["']robots["']/gi) !== 1) fail(`${relativeHtml} must have exactly one robots meta tag`);
    if (/Hexo Theme Redefine|Redefine Team|Redefine Your Hexo Journey/.test(html)) fail(`${relativeHtml} contains legacy theme branding`);
    const searchRecord = search.find((item) => item.url === record.url);
    if (!searchRecord || searchRecord.title !== record.data.title) fail(`${language} search index is missing ${record.relativePath}`);
    if (!feed.includes(`<guid isPermaLink="true">https://edgeone-page.edgeone.app${record.url}</guid>`)) {
      fail(`${language} feed is missing ${record.relativePath}`);
    }
  }
}

const serviceWorker = read("service-worker.js");
if (!serviceWorker.includes("edgeone-page-") || serviceWorker.includes("Date.now")) fail("Service worker cache version is not deterministic");
for (const relative of ["robots.txt", "sitemap.xml", "404.html", "icons/edgeone-icon.svg"]) {
  if (!exists(relative)) fail(`Missing public/${relative}`);
}
console.log("[audit] EdgeOne production output and published articles passed.");
