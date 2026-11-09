"use strict";

// 单语站点（zh-CN）：只创建中文文章草稿。
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const slug = process.argv[2];

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("Usage: npm run new:post -- my-article-slug");
  console.error("The slug may contain lowercase letters, numbers, and hyphens only.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
const directory = path.join(PROJECT_ROOT, "source", "zh-CN", "_posts");
const filePath = path.join(directory, `${slug}.md`);
if (fs.existsSync(filePath)) {
  console.error(`Refusing to overwrite existing file: ${path.relative(PROJECT_ROOT, filePath)}`);
  process.exit(1);
}

const content = `---
title: "请填写文章标题"
description: "请填写用于搜索结果、RSS 和社交分享的中文摘要。"
date: ${timestamp}
updated: ${timestamp}
lang: zh-CN
translation_key: ${slug}
content_type: article
domain: unclassified
published: false
categories:
  - 待分类
tags:
  - 待补充
  - 草稿
---

在这里编写简体中文文章。完成后删除占位文字，并将 published 改为 true。
`;
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(filePath, content, "utf8");
console.log(`Created draft ${path.relative(PROJECT_ROOT, filePath)}`);
