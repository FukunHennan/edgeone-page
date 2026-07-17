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
    body: "在这里编写简体中文文章。",
  },
  en: {
    title: "Enter the English title",
    body: "Write the English version of the article here.",
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
date: ${timestamp}
lang: ${language}
translation_key: ${slug}
categories: []
tags: []
---

${definition.body}
`;
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Created ${path.relative(PROJECT_ROOT, filePath)}`);
}
