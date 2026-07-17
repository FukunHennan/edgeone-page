"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ORIGIN = "https://edgeone-page.edgeone.app";
const LOCALES = {
  "zh-CN": {
    name: "EdgeOne Page 中文站",
    description: "面向腾讯云 EdgeOne Pages 的简体中文和英文双语站点。",
    offline: "当前处于离线状态",
    message: "网络恢复后，请刷新页面继续浏览。已经访问过的页面仍可离线打开。",
    home: "返回中文首页",
    reload: "重新加载",
  },
  en: {
    name: "EdgeOne Page English",
    description: "A Simplified Chinese and English Hexo site optimized for Tencent EdgeOne Pages.",
    offline: "You are offline",
    message: "Refresh after your connection returns. Pages you already visited may still be available offline.",
    home: "Back to English home",
    reload: "Reload",
  },
};

const language = () => {
  const value = hexo.config.language;
  const active = Array.isArray(value) ? value[0] : value;
  return active === "en" ? "en" : "zh-CN";
};

const escapeHtml = (value) => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const readTitle = (html) => {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : "EdgeOne Page";
};

const readDescription = (html, fallback) => {
  const patterns = [
    /<meta[^>]+name=[\"']description[\"'][^>]+content=[\"']([^\"']*)[\"']/i,
    /<meta[^>]+content=[\"']([^\"']*)[\"'][^>]+name=[\"']description[\"']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return fallback;
};

hexo.extend.filter.register("after_render:html", function injectPwaMetadata(html, data) {
  if (!html.includes("</head>")) return html;
  const lang = language();
  const locale = LOCALES[lang];
  const route = String(data?.path || "").replace(/^\/+/, "");
  const relativeUrl = route.endsWith("index.html") ? route.slice(0, -10) : route;
  const url = `${ORIGIN}/${lang}/${relativeUrl}`.replace(/\/+$/, "/");
  const additions = [];

  if (!html.includes('rel="manifest"')) additions.push(`<link rel="manifest" href="/${lang}/manifest.webmanifest">`);
  if (!html.includes('type="application/rss+xml"')) additions.push(`<link rel="alternate" type="application/rss+xml" title="${escapeHtml(locale.name)} RSS" href="/${lang}/feed.xml">`);
  if (!html.includes('name="application-name"')) {
    additions.push(`<meta name="application-name" content="${escapeHtml(locale.name)}">`);
    additions.push('<meta name="apple-mobile-web-app-capable" content="yes">');
    additions.push('<meta name="mobile-web-app-capable" content="yes">');
  }

  if (!html.includes('application/ld+json')) {
    const title = readTitle(html);
    const description = readDescription(html, locale.description);
    let schema = null;
    if (route.startsWith("posts/")) {
      schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title.replace(/\s+\|\s+EdgeOne Page.*$/i, ""),
        description,
        url,
        mainEntityOfPage: url,
        inLanguage: lang,
        author: { "@type": "Person", name: hexo.config.author || "FukunHennan" },
        publisher: {
          "@type": "Organization",
          name: "EdgeOne Page",
          logo: { "@type": "ImageObject", url: `${ORIGIN}/icons/edgeone-icon.svg` },
        },
      };
    } else if (!route || route === "index.html") {
      schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        url: `${ORIGIN}/${lang}/`,
        name: "EdgeOne Page",
        description,
        inLanguage: lang,
      };
    }
    if (schema) additions.push(`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`);
  }

  if (!html.includes('navigator.serviceWorker.register("/service-worker.js"')) {
    additions.push('<script>(()=>{if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/service-worker.js",{scope:"/"}).catch(error=>console.error("[edgeone-page] Service worker registration failed:",error)),{once:true})}})()</script>');
  }

  return html.replace("</head>", `${additions.join("\n")}\n</head>`);
});

hexo.extend.filter.register("after_generate", function writePwaFiles() {
  const lang = language();
  const locale = LOCALES[lang];
  const publicRoot = path.resolve(hexo.base_dir, "public");
  const languageRoot = path.join(publicRoot, lang);
  const iconRoot = path.join(publicRoot, "icons");
  fs.mkdirSync(languageRoot, { recursive: true });
  fs.mkdirSync(iconRoot, { recursive: true });

  const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><path d="M132 142h248v62H202v51h158v60H202v55h184v62H132V142z" fill="#fff"/></svg>';
  fs.writeFileSync(path.join(iconRoot, "edgeone-icon.svg"), icon, "utf8");
  fs.writeFileSync(path.join(iconRoot, "edgeone-maskable.svg"), icon.replace('rx="112"', 'rx="0"'), "utf8");

  const manifest = {
    id: `/${lang}/`,
    name: locale.name,
    short_name: "EdgeOne Page",
    description: locale.description,
    lang,
    start_url: `/${lang}/`,
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    icons: [
      { src: "/icons/edgeone-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/edgeone-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
  fs.writeFileSync(path.join(languageRoot, "manifest.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const font = lang === "en" ? 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' : '"PingFang SC","Microsoft YaHei",system-ui,sans-serif';
  const offline = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta name="theme-color" content="#2563eb"><link rel="manifest" href="/${lang}/manifest.webmanifest"><title>${escapeHtml(locale.offline)} | EdgeOne Page</title><style>:root{color-scheme:light dark;font-family:${font}}body{min-height:100vh;margin:0;display:grid;place-items:center;background:#f8fafc;color:#0f172a}main{max-width:640px;padding:48px;text-align:center}h1{font-size:5rem;margin:0;color:#2563eb}p{color:#64748b;line-height:1.8}a,button{display:inline-block;margin:.5rem;padding:.8rem 1.2rem;border:0;border-radius:.75rem;background:#2563eb;color:#fff;text-decoration:none;font:inherit;cursor:pointer}@media(prefers-color-scheme:dark){body{background:#020617;color:#e2e8f0}p{color:#94a3b8}}</style></head><body><main><h1>↯</h1><h2>${escapeHtml(locale.offline)}</h2><p>${escapeHtml(locale.message)}</p><a href="/${lang}/">${escapeHtml(locale.home)}</a><button onclick="location.reload()">${escapeHtml(locale.reload)}</button></main></body></html>`;
  fs.writeFileSync(path.join(languageRoot, "offline.html"), offline, "utf8");

  const cacheVersion = crypto.createHash("sha256").update(`${Date.now()}-${lang}`).digest("hex").slice(0, 12);
  const worker = `"use strict";\nconst CACHE="edgeone-page-${cacheVersion}";\nconst CORE=["/","/language-manifest.json","/zh-CN/","/en/","/zh-CN/offline.html","/en/offline.html","/icons/edgeone-icon.svg"];\nself.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));\nself.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("edgeone-page-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));\nself.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==location.origin)return;if(request.mode==="navigate"){event.respondWith(fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response}).catch(async()=>await caches.match(request)||await caches.match(url.pathname.startsWith("/en/")?"/en/offline.html":"/zh-CN/offline.html")));return}if(["style","script","image","font"].includes(request.destination)){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response})))}});\n`;
  fs.writeFileSync(path.join(publicRoot, "service-worker.js"), worker, "utf8");
});
