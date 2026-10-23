"use strict";

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const { collectLanguagePosts, isPublished, validDate } = require("./content-records");
const { finalizeServiceWorker } = require("./finalize-service-worker");
const { walkFiles } = require("./output-hash");

const root = path.resolve(__dirname, "..", "astro-dist");
const origin = "https://edgeone.chenfukun.space";
const languages = ["zh-CN", "en"];
const projectUrlsFor = (lang) => new Set(yaml.load(fs.readFileSync(
  path.join(__dirname, "..", "data", lang, "projects.yml"), "utf8",
)).map((project) => new URL(project.post, `${origin}/${lang}/projects/`).pathname));
const xml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[char]);
const write = (relative, content) => {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
};

if (!fs.existsSync(path.join(root, "zh-CN", "index.html"))) {
  throw new Error("Astro output is missing. Run astro build first.");
}

const icon = path.join(__dirname, "..", "themes", "edg-one-page", "source", "images", "稻田鼠.jpg");
fs.mkdirSync(path.join(root, "icons"), { recursive: true });
fs.copyFileSync(icon, path.join(root, "icons", "稻田鼠.jpg"));

for (const lang of languages) {
  const projectUrls = projectUrlsFor(lang);
  const posts = collectLanguagePosts(lang)
    .filter((post) => isPublished(post.data) && validDate(post.data.date) <= new Date() && projectUrls.has(post.url))
    .sort((a, b) => validDate(b.data.date) - validDate(a.data.date));
  const en = lang === "en";
  const name = en ? "Fukun's Personal Hub" : "稻田鼠的个人空间";
  const description = en ? "Engineering, research and software projects." : "工程、研究与软件项目。";
  const items = posts.slice(0, 30).map((post) => {
    const link = `${origin}${post.url}`;
    const date = validDate(post.data.date).toUTCString();
    return `    <item><title>${xml(post.data.title)}</title><link>${xml(link)}</link><guid isPermaLink="true">${xml(link)}</guid><pubDate>${date}</pubDate><description>${xml(post.data.description || post.body.slice(0, 280))}</description></item>`;
  }).join("\n");
  write(`${lang}/feed.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${xml(name)}</title><link>${origin}/${lang}/</link><description>${xml(description)}</description><language>${lang}</language>\n${items}\n</channel></rss>\n`);

  const manifest = {
    id: `/${lang}/`, name, short_name: en ? "Fukun" : "稻田鼠", description, lang,
    start_url: `/${lang}/`, scope: `/${lang}/`, display: "standalone",
    background_color: "#f8f8f5", theme_color: "#f8f8f5",
    icons: [{ src: "/icons/稻田鼠.jpg", sizes: "640x640", type: "image/jpeg", purpose: "any maskable" }],
  };
  write(`${lang}/manifest.webmanifest`, `${JSON.stringify(manifest, null, 2)}\n`);

  const title = en ? "You are offline" : "当前处于离线状态";
  const message = en ? "Reconnect and reload to continue browsing." : "网络恢复后，刷新页面即可继续浏览。";
  const home = en ? "Back to home" : "返回首页";
  const reload = en ? "Reload" : "重新加载";
  write(`${lang}/offline.html`, `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>body{min-height:100vh;margin:0;display:grid;place-items:center;background:#f8f8f5;color:#171b18;font-family:system-ui,sans-serif}main{max-width:36rem;padding:2rem;text-align:center}a,button{display:inline-block;margin:.5rem;padding:.75rem 1rem;border:1px solid currentColor;border-radius:4px;background:transparent;color:inherit;text-decoration:none;font:inherit;cursor:pointer}</style></head><body><main><h1>${title}</h1><p>${message}</p><a href="/${lang}/">${home}</a><button type="button" onclick="location.reload()">${reload}</button></main></body></html>`);
  const missing = en ? 'Page not found' : '页面未找到';
  write(`${lang}/404.html`, `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${missing}</title><style>body{min-height:100vh;margin:0;display:grid;place-items:center;background:#f8f8f5;color:#171b18;font-family:system-ui,sans-serif}main{padding:2rem;text-align:center}a{color:inherit}</style></head><body><main><h1>${missing}</h1><a href="/${lang}/">${home}</a></main></body></html>`);
}

const routes = walkFiles(root).filter((file) => file.endsWith("index.html"));
for (const lang of languages) {
  const publicRoutes = new Set([`/${lang}/`, `/${lang}/projects/`, `/${lang}/experience/`,
    `/${lang}/resume/`, `/${lang}/about/`, ...projectUrlsFor(lang)]);
  const entries = routes.filter((file) => path.relative(root, file).split(path.sep)[0] === lang)
    .map((file) => `/${path.relative(root, path.dirname(file)).split(path.sep).join("/")}/`)
    .filter((pathname) => publicRoutes.has(pathname))
    .map((pathname) => `  <url><loc>${xml(`${origin}${pathname}`)}</loc></url>`)
    .sort();
  write(`${lang}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`);
}
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${languages.map((lang) => `  <sitemap><loc>${origin}/${lang}/sitemap.xml</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
write("language-manifest.json", `${JSON.stringify({ default: "zh-CN", supported: languages }, null, 2)}\n`);
write("404.html", '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>页面未找到 · 稻田鼠</title><style>body{min-height:100vh;margin:0;display:grid;place-items:center;background:#f8f8f5;color:#171b18;font-family:system-ui,sans-serif}main{padding:2rem;text-align:center}a{color:inherit}</style></head><body><main><h1>页面未找到</h1><p>这个地址不存在，或页面已移动。</p><a href="/zh-CN/">返回首页</a></main></body></html>');
finalizeServiceWorker(root);
console.log(`[astro postprocess] RSS, sitemaps, manifests and offline pages generated for ${languages.join(", ")}.`);
