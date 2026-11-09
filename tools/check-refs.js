"use strict";

// 站内文章引用检查（不依赖网络）：
//   无参数            —— 全量模式：校验所有站内 /zh-CN/posts/<slug>/ 引用指向存在的文章，进 npm run check
//   node ... <slug>   —— 查询模式：列出谁引用了 <slug>，供删除文章前使用；有引用时退出码为 1
//   npm run check:refs -- <slug>

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "astro-src", "pages", "zh-CN", "posts");
const EXTS = new Set([".html", ".md", ".astro", ".ejs", ".yml", ".yaml", ".ts", ".js", ".cjs", ".mjs"]);
const SKIP_DIRS = new Set(["node_modules", "astro-dist", ".astro", ".git", "public", "docs"]);
const SCAN_ROOTS = ["astro-src", "source", "data", "themes", "agents"];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (EXTS.has(path.extname(entry.name).toLowerCase()) && !entry.name.endsWith(".min.js")) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function existingSlugs() {
  if (!fs.existsSync(POSTS_DIR)) return new Set();
  return new Set(fs.readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(POSTS_DIR, entry.name, "index.html")))
    .map((entry) => entry.name));
}

function refsIn(text) {
  const slugs = new Set();
  for (const match of text.matchAll(/\/zh-CN\/posts\/([a-z0-9-]+)/g)) slugs.add(match[1]);
  for (const match of text.matchAll(/\.\.\/posts\/([a-z0-9-]+)/g)) slugs.add(match[1]);
  return slugs;
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

const target = process.argv[2];
const files = SCAN_ROOTS.flatMap((name) => walk(path.join(ROOT, name)));

if (target) {
  const selfPath = `astro-src/pages/zh-CN/posts/${target}/index.html`;
  const hits = [];
  for (const file of files) {
    if (rel(file) === selfPath) continue;
    if (refsIn(fs.readFileSync(file, "utf8")).has(target)) hits.push(rel(file));
  }
  if (hits.length) {
    console.log(`[refs] 文章 ${target} 仍被以下文件引用，删除前请先处理：`);
    for (const hit of hits) console.log(`  - ${hit}`);
    process.exitCode = 1;
  } else {
    console.log(`[refs] 没有其他文件引用 ${target}，可以安全删除。`);
  }
} else {
  const exist = existingSlugs();
  const dangling = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const slug of refsIn(text)) {
      if (!exist.has(slug)) dangling.push({ file: rel(file), slug });
    }
  }
  if (dangling.length) {
    console.error("[refs] 发现指向不存在文章的站内链接：");
    for (const item of dangling) console.error(`  - ${item.file} -> /zh-CN/posts/${item.slug}/`);
    process.exitCode = 1;
  } else {
    console.log(`[refs] Checked ${exist.size} article(s): all internal references resolve.`);
  }
}
