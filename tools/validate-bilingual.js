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
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(absolutePath));
    else if (entry.isFile() && /\.md$/i.test(entry.name)) files.push(absolutePath);
  }
  return files.sort();
}

function readFrontMatter(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!source.startsWith("---")) throw new Error(`${filePath}: missing front matter`);
  const closing = source.indexOf("\n---", 3);
  if (closing === -1) throw new Error(`${filePath}: unclosed front matter`);
  return yaml.load(source.slice(3, closing).trim()) || {};
}

function collectLanguagePosts(language) {
  const postsRoot = path.join(PROJECT_ROOT, "source", language, "_posts");
  const records = new Map();
  for (const filePath of walkMarkdown(postsRoot)) {
    const relativePath = path.relative(postsRoot, filePath).split(path.sep).join("/");
    records.set(relativePath, { filePath, frontMatter: readFrontMatter(filePath) });
  }
  return records;
}

function validateBilingualContent() {
  const errors = [];
  const postsByLanguage = Object.fromEntries(
    LANGUAGE_CODES.map((language) => [language, collectLanguagePosts(language)]),
  );
  const allRelativePaths = new Set();
  Object.values(postsByLanguage).forEach((records) => {
    records.forEach((_, relativePath) => allRelativePaths.add(relativePath));
  });
  const seenKeys = Object.fromEntries(LANGUAGE_CODES.map((language) => [language, new Map()]));

  for (const relativePath of [...allRelativePaths].sort()) {
    const pair = Object.fromEntries(
      LANGUAGE_CODES.map((language) => [language, postsByLanguage[language].get(relativePath)]),
    );

    for (const language of LANGUAGE_CODES) {
      const record = pair[language];
      if (!record) {
        errors.push(`${relativePath}: missing ${language} article`);
        continue;
      }
      const data = record.frontMatter;
      if (data.lang !== language) errors.push(`${relativePath}: ${language} file must declare lang: ${language}`);
      if (typeof data.title !== "string" || !data.title.trim()) errors.push(`${relativePath}: ${language} file requires a title`);
      if (typeof data.translation_key !== "string" || !data.translation_key.trim()) {
        errors.push(`${relativePath}: ${language} file requires translation_key`);
      } else {
        const previous = seenKeys[language].get(data.translation_key);
        if (previous && previous !== relativePath) {
          errors.push(`${relativePath}: duplicate translation_key '${data.translation_key}' in ${language}`);
        }
        seenKeys[language].set(data.translation_key, relativePath);
      }
    }

    if (pair["zh-CN"] && pair.en) {
      const zhKey = pair["zh-CN"].frontMatter.translation_key;
      const enKey = pair.en.frontMatter.translation_key;
      if (zhKey && enKey && zhKey !== enKey) errors.push(`${relativePath}: translation_key values do not match`);
    }
  }

  if (allRelativePaths.size === 0) errors.push("No bilingual posts were found");
  if (errors.length) throw new Error(`Bilingual content validation failed:\n- ${errors.join("\n- ")}`);
  return { languages: LANGUAGE_CODES, pairedPosts: allRelativePaths.size };
}

if (require.main === module) {
  try {
    const result = validateBilingualContent();
    console.log(`[bilingual] Validated ${result.pairedPosts} paired article(s) for ${result.languages.join(" and ")}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { LANGUAGE_CODES, validateBilingualContent };
