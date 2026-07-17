"use strict";

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
const definitions = {
  "zh-CN": {
    title: "请填写中文标题",
    description: "请填写用于搜索结果、RSS 和社交分享的中文摘要。",
    category: "待分类",
    tags: ["待补充", "草稿"],
    body: "在这里编写简体中文文章。完成后删除占位文字，并将 published 改为 true。",
  },
  en: {
    title: "Enter the English title",
    description: "Add an English summary for search, RSS, and social sharing.",
    category: "Uncategorized",
    tags: ["todo", "draft"],
    body: "Write the English article here. Remove placeholders and set published to true before publishing.",
  },
};

for (const [language, definition] of Object.entries(definitions)) {
  const directory = path.join(PROJECT_ROOT, "source", language, "_posts");
  const filePath = path.join(directory, `${slug}.md`);
  if (fs.existsSync(filePath)) {
    console.error(`Refusing to overwrite existing file: ${path.relative(PROJECT_ROOT, filePath)}`);
    process.exit(1);
  }

  fs.mkdirSync(directory, { recursive: true });
  const content = `---
title: "${definition.title}"
description: "${definition.description}"
date: ${timestamp}
updated: ${timestamp}
lang: ${language}
translation_key: ${slug}
published: false
categories:
  - ${definition.category}
tags:
  - ${definition.tags[0]}
  - ${definition.tags[1]}
---

${definition.body}
`;
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Created draft ${path.relative(PROJECT_ROOT, filePath)}`);
}
