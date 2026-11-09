"use strict";

// npm run check:links —— 手动运行（需要网络，不进 npm run check 主链路）。
// 扫描 projects.yml 与文章（md / 静态 HTML）中引用的
// https://github.com/FukunHennan/<repo> 链接，通过 GitHub API 核对仓库是否存活；
// 对已删除的仓库，列出全部引用位置，防止死链滞留。

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "..");
const OWNER_URL_RE = /https:\/\/github\.com\/FukunHennan\/([A-Za-z0-9._-]+)/g;
const refs = new Map();

function addRefs(repo, file) {
  if (!refs.has(repo)) refs.set(repo, new Set());
  refs.get(repo).add(file);
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function scanFile(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(OWNER_URL_RE)) addRefs(match[1], rel(file));
}

function walk(dir, exts) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "astro-dist", ".astro", ".git"].includes(entry.name)) walk(target, exts);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) scanFile(target);
  }
}

const ymlPath = path.join(ROOT, "data", "zh-CN", "projects.yml");
for (const project of yaml.load(fs.readFileSync(ymlPath, "utf8")) || []) {
  const match = String(project.github || "").match(/github\.com\/FukunHennan\/([A-Za-z0-9._-]+)/);
  if (match) addRefs(match[1], rel(ymlPath));
}
walk(path.join(ROOT, "source"), [".md"]);
walk(path.join(ROOT, "astro-src", "pages"), [".html"]);

async function main() {
  let dead = 0;
  for (const [repo, files] of [...refs].sort()) {
    const url = `https://api.github.com/repos/FukunHennan/${repo}`;
    let status;
    try {
      const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
      status = response.status;
    } catch (error) {
      console.error(`[links] 无法访问 GitHub API：${repo}（${error.message}），请稍后重试`);
      process.exitCode = 1;
      continue;
    }
    if (status === 200) {
      console.log(`[links] OK   ${repo}`);
    } else if (status === 404) {
      dead += 1;
      console.error(`[links] DEAD ${repo}，引用位置：`);
      for (const file of files) console.error(`         - ${file}`);
      process.exitCode = 1;
    } else {
      console.error(`[links] ERR  ${repo} HTTP ${status}`);
      process.exitCode = 1;
    }
  }
  console.log(`[links] Checked ${refs.size} repositor(ies), ${dead} dead.`);
}

main();
