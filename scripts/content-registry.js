"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");

function languageOf(config) {
  const value = Array.isArray(config.language) ? config.language[0] : config.language;
  return value === "en" ? "en" : "zh-CN";
}

function read(language, name) {
  const file = path.join(DATA, language, `${name}.yml`);
  if (!fs.existsSync(file)) throw new Error(`Missing registry file: ${file}`);
  const value = yaml.load(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(value)) throw new Error(`Registry must be an array: ${file}`);
  return value;
}

function escape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderProjects(language, items) {
  const en = language === "en";
  const t = en ? { title: "Projects", description: "A structured archive of engineering systems, research and software projects.", views: "Project views", all: "All projects", active: "Active", research: "Research", software: "Software", embedded: "Embedded", graph: "Projects are connected", graphText: "Projects can link to Notes, Tools and Blog as the archive grows.", notes: "Open Notes →", heading: "Building now", unit: "projects", blog: "Blog →", github: "GitHub →" } : { title: "项目中心", description: "这里记录正在构建的工程系统，并把项目、知识笔记和常用工具连接起来。", views: "项目视图", all: "全部项目", active: "进行中", research: "研究", software: "软件", embedded: "嵌入式", graph: "项目不是孤岛", graphText: "项目可以逐步关联 Notes、Tools 和 Blog，形成可追踪的工程记录。", notes: "进入知识库 →", heading: "正在构建", unit: "个项目", blog: "博客 →", github: "GitHub →" };
  const count = (category) => items.filter((item) => item.category === category).length;
  const active = items.filter((item) => item.status === "active").length;
  const cards = items.map((item, index) => `<article data-kind="${escape(`${item.status} ${item.category}`)}"><div class="project-card-top"><span class="project-status ${escape(item.status)}">● ${escape(item.label)}</span><b>${String(index + 1).padStart(2, "0")}</b></div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><div class="project-tags">${(item.tags || []).map((tag) => `<span>${escape(tag)}</span>`).join("")}</div><footer><a href="${escape(item.github)}">${t.github}</a><a href="/${language}/${escape(String(item.post || "").replace(/^\.\.\/posts\//, "posts/").replace(/^\/+/, ""))}">${t.blog}</a></footer></article>`).join("");
  return `<div class="workspace-page projects-workspace"><header class="workspace-hero workspace-hero-projects"><span class="workspace-kicker">BUILD · SHIP · LEARN</span><h1>${t.title}</h1><p>${t.description}</p><div class="workspace-metrics"><div><b>${items.length}</b><small>PROJECTS</small></div><div><b>${active}</b><small>ACTIVE</small></div><div><b>${new Set(items.map((item) => item.category)).size}</b><small>DOMAINS</small></div></div></header><div class="workspace-layout"><aside class="workspace-sidebar"><b>${t.views}</b><button class="active" data-project-filter="all">${t.all} <span>${items.length}</span></button><button data-project-filter="active">${t.active} <span>${active}</span></button><button data-project-filter="research">${t.research} <span>${count("research")}</span></button><button data-project-filter="software">${t.software} <span>${count("software")}</span></button><button data-project-filter="embedded">${t.embedded} <span>${count("embedded")}</span></button><div class="workspace-side-card"><small>KNOWLEDGE GRAPH</small><strong>${t.graph}</strong><p>${t.graphText}</p><a href="/${language}/notes/">${t.notes}</a></div></aside><main class="workspace-content"><div class="workspace-content-head"><div><small>ENGINEERING ARCHIVE</small><h2>${t.heading}</h2></div><span id="project-count">${items.length} ${t.unit}</span></div><div class="project-workspace-grid">${cards}</div></main></div></div><script>(function(){function init(){var r=document.querySelector('.projects-workspace');if(!r||r.dataset.ready)return;r.dataset.ready='1';var bs=r.querySelectorAll('[data-project-filter]'),items=r.querySelectorAll('.project-workspace-grid article'),count=r.querySelector('#project-count');bs.forEach(function(b){b.onclick=function(){bs.forEach(function(x){x.classList.remove('active')});b.classList.add('active');var f=b.dataset.projectFilter,n=0;items.forEach(function(x){var ok=f==='all'||x.dataset.kind.split(' ').includes(f);x.hidden=!ok;if(ok)n++});count.textContent=n+' ${t.unit}'}})}document.addEventListener('DOMContentLoaded',init);document.addEventListener('swup:contentReplaced',init);init()})();</script>`;
}

function renderTools(language, items) {
  const en = language === "en";
  const cards = items.map((item) => `<button data-tool="${escape(item.key)}" data-kind="${escape(item.kind)}" data-search="${escape(item.search)}"><span>${escape(item.icon)}</span><div><b>${escape(item.title)}</b><small>${escape(item.description)}</small></div><i>→</i></button>`).join("");
  return `<div class="workspace-page toolbox-workspace"><header class="workspace-hero"><span class="workspace-kicker">LOCAL FIRST · TOOLBOX</span><h1>${en ? "Engineering Toolbox" : "工程工具箱"}</h1><p>${en ? "Fast browser-side utilities for everyday development and engineering work." : "一组直接在浏览器中运行的开发与工程小工具。"}</p><div class="workspace-search"><span>⌕</span><input id="tool-search" placeholder="${en ? "Search JSON, Base64, CRC, radix…" : "搜索 JSON、Base64、CRC、进制转换……"}"><kbd>LOCAL</kbd></div></header><div class="toolbox-layout"><aside class="workspace-sidebar"><b>${en ? "Categories" : "工具分类"}</b><button class="active" data-tool-filter="all">${en ? "All tools" : "全部工具"} <span>${items.length}</span></button><button data-tool-filter="developer">${en ? "Developer" : "开发"}</button><button data-tool-filter="embedded">${en ? "Embedded" : "嵌入式"}</button><button data-tool-filter="text">${en ? "Text" : "文本"}</button><div class="workspace-side-card"><small>PRIVACY</small><strong>${en ? "Runs in your browser" : "浏览器本地运行"}</strong><p>${en ? "Tool input stays on this page." : "工具输入只在当前页面中处理。"}</p></div></aside><main class="workspace-content"><div class="workspace-content-head"><div><small>AVAILABLE NOW</small><h2>${en ? "Tools" : "可用工具"}</h2></div><span id="tool-count">${items.length} ${en ? "tools" : "个工具"}</span></div><div class="tool-app-grid">${cards}</div><section id="tool-panel" class="tool-panel" hidden></section></main></div></div><script src="/${language}/js/toolbox.js"></script>`;
}

hexo.extend.filter.register("before_post_render", function (data) {
  const language = languageOf(this.config);
  if (data.registry === "projects") data.content = renderProjects(language, read(language, "projects"));
  if (data.registry === "tools") data.content = renderTools(language, read(language, "tools"));
  return data;
});
