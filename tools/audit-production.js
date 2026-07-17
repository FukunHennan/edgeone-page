"use strict";
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,".."),PUBLIC=path.join(ROOT,"public");
const config=JSON.parse(fs.readFileSync(path.join(ROOT,"edgeone.json"),"utf8"));
const fail=m=>{throw new Error(m)},read=p=>fs.readFileSync(path.join(PUBLIC,p),"utf8");
if(config.installCommand!=="npm ci"||config.buildCommand!=="npm run build:production"||config.outputDirectory!=="public")fail("Invalid EdgeOne build configuration");
if(!/^20\./.test(String(config.nodeVersion)))fail("EdgeOne must use Node.js 20");
for(const l of ["zh-CN","en"]){for(const p of [`${l}/index.html`,`${l}/manifest.webmanifest`,`${l}/offline.html`,`${l}/feed.xml`,`${l}/sitemap.xml`])if(!fs.existsSync(path.join(PUBLIC,p)))fail(`Missing public/${p}`);const h=read(`${l}/index.html`);if(!h.includes(`lang="${l}"`)||!h.includes("data-edgeone-schema")||!h.includes("data-edgeone-service-worker"))fail(`${l} entry failed metadata audit`);const m=JSON.parse(read(`${l}/manifest.webmanifest`));if(m.lang!==l||m.start_url!==`/${l}/`||m.scope!==`/${l}/`)fail(`${l} manifest is inconsistent`)}
const sw=read("service-worker.js");if(!sw.includes("edgeone-page-")||sw.includes("Date.now"))fail("Service worker cache version is not deterministic");
for(const p of ["robots.txt","sitemap.xml","404.html","icons/edgeone-icon.svg","language-manifest.json"])if(!fs.existsSync(path.join(PUBLIC,p)))fail(`Missing public/${p}`);
console.log("[audit] EdgeOne production output passed.");
