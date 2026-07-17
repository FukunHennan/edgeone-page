"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const LANGUAGE_CODES = ["zh-CN", "en"];

function walkMarkdown(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(target));
    else if (entry.isFile() && /\.md$/i.test(entry.name)) files.push(target);
  }
  return files.sort();
}

function splitFrontMatter(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!source.startsWith("---")) throw new Error(`${filePath}: missing front matter`);
  const closing = source.indexOf("\n---", 3);
  if (closing === -1) throw new Error(`${filePath}: unclosed front matter`);
  return {
    data: yaml.load(source.slice(3, closing).trim()) || {},
    rawBody: source.slice(closing + 4).trim(),
  };
}

function plainText(markdown) {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[>*_~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPublished(data) {
  return data.published !== false && data.draft !== true;
}

function normalizeSlug(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.md$/i, "");
}

function recordUrl(language, record) {
  const permalink = normalizeSlug(record.data.permalink);
  if (permalink) return `/${language}/${permalink}/`.replace(/\/{2,}/g, "/");
  const slug = normalizeSlug(record.data.slug || record.slug);
  return `/${language}/posts/${slug}/`;
}

function collectLanguagePosts(language) {
  if (!LANGUAGE_CODES.includes(language)) throw new Error(`Unsupported language: ${language}`);
  const postsRoot = path.join(PROJECT_ROOT, "source", language, "_posts");
  return walkMarkdown(postsRoot).map((filePath) => {
    const { data, rawBody } = splitFrontMatter(filePath);
    const relativePath = path.relative(postsRoot, filePath).split(path.sep).join("/");
    const slug = normalizeSlug(relativePath);
    const record = {
      language,
      filePath,
      relativePath,
      slug,
      data,
      rawBody,
      body: plainText(rawBody),
      published: isPublished(data),
    };
    record.url = recordUrl(language, record);
    return record;
  });
}

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

module.exports = {
  LANGUAGE_CODES,
  PROJECT_ROOT,
  collectLanguagePosts,
  isPublished,
  plainText,
  recordUrl,
  splitFrontMatter,
  validDate,
  walkMarkdown,
};
