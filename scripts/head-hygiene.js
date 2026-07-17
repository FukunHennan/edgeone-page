"use strict";

const language = () => {
  const value = hexo.config.language;
  const active = Array.isArray(value) ? value[0] : value;
  return active === "en" ? "en" : "zh-CN";
};

const escapeHtml = (value) => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;");

hexo.extend.filter.register("after_render:html", function cleanHead(html) {
  if (!html.includes("</head>")) return html;
  let output = html
    .replace(/Hexo Theme Redefine/g, "EdgeOne Page")
    .replace(/Redefine Team/g, "EdgeOne Page")
    .replace(/Redefine Theme/g, "EdgeOne Page")
    .replace(/Redefine Your Hexo Journey\.?/g, "Professional bilingual publishing on EdgeOne Pages.")
    .replace(/\s*<meta\s+name=["']revisit-after["'][^>]*>/gi, "");

  const robotsPattern = /<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  const robots = [...output.matchAll(robotsPattern)].map((match) => match[1]);
  const preferred = robots.find((value) => value !== "index,follow") || robots[0] || "index,follow";
  output = output.replace(robotsPattern, "");

  const lang = language();
  const locale = lang === "en" ? "en_US" : "zh_CN";
  const alternate = lang === "en" ? "zh_CN" : "en_US";
  const additions = [
    `<meta name="robots" content="${escapeHtml(preferred)}">`,
    '<meta name="color-scheme" content="light dark">',
    '<meta name="format-detection" content="telephone=no">',
  ];
  if (!output.includes('property="og:locale"')) {
    additions.push(`<meta property="og:locale" content="${locale}">`);
    additions.push(`<meta property="og:locale:alternate" content="${alternate}">`);
  }
  return output.replace("</head>", `${additions.join("\n")}\n</head>`);
});
