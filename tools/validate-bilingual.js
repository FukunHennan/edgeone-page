"use strict";

const {
  LANGUAGE_CODES,
  collectLanguagePosts,
  validDate,
} = require("./content-records");

const PLACEHOLDER_PATTERNS = [
  /请填写|在这里编写|待补充|todo|tbd/i,
  /enter the english title|write the english version/i,
];

function hasPlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(String(value || "")));
}

function validateRecord(record, errors) {
  const data = record.data;
  const label = `${record.relativePath}: ${record.language}`;
  if (data.lang !== record.language) errors.push(`${label} must declare lang: ${record.language}`);
  if (typeof data.title !== "string" || !data.title.trim()) errors.push(`${label} requires a title`);
  if (typeof data.translation_key !== "string" || !data.translation_key.trim()) {
    errors.push(`${label} requires translation_key`);
  } else if (data.translation_key !== record.slug) {
    errors.push(`${label} translation_key must match slug '${record.slug}'`);
  }

  const date = validDate(data.date);
  const updated = data.updated ? validDate(data.updated) : date;
  if (!date) errors.push(`${label} requires a valid date`);
  if (data.updated && !updated) errors.push(`${label} has an invalid updated date`);
  if (date && updated && updated < date) errors.push(`${label} updated date cannot be earlier than date`);

  if (data.categories !== undefined && !Array.isArray(data.categories)) errors.push(`${label} categories must be an array`);
  if (data.tags !== undefined && !Array.isArray(data.tags)) errors.push(`${label} tags must be an array`);

  if (!record.published) return;
  const description = typeof data.description === "string" ? data.description.trim() : "";
  if (description.length < 20 || description.length > 240) {
    errors.push(`${label} published article description must contain 20-240 characters`);
  }
  if (!Array.isArray(data.categories) || data.categories.length === 0) errors.push(`${label} published article requires a category`);
  if (!Array.isArray(data.tags) || data.tags.length < 2) errors.push(`${label} published article requires at least two tags`);
  if (record.body.length < 120) errors.push(`${label} published article body is too short`);
  if (hasPlaceholder(data.title) || hasPlaceholder(description) || hasPlaceholder(record.rawBody)) {
    errors.push(`${label} published article still contains placeholder content`);
  }
}

function validateBilingualContent() {
  const errors = [];
  const postsByLanguage = Object.fromEntries(
    LANGUAGE_CODES.map((language) => [language, new Map(
      collectLanguagePosts(language).map((record) => [record.relativePath, record]),
    )]),
  );
  const paths = new Set();
  for (const records of Object.values(postsByLanguage)) {
    for (const relativePath of records.keys()) paths.add(relativePath);
  }
  const seenKeys = Object.fromEntries(LANGUAGE_CODES.map((language) => [language, new Map()]));
  let publishedPairs = 0;

  for (const relativePath of [...paths].sort()) {
    const pair = Object.fromEntries(
      LANGUAGE_CODES.map((language) => [language, postsByLanguage[language].get(relativePath)]),
    );
    for (const language of LANGUAGE_CODES) {
      const record = pair[language];
      if (!record) {
        errors.push(`${relativePath}: missing ${language} article`);
        continue;
      }
      validateRecord(record, errors);
      const key = record.data.translation_key;
      if (typeof key === "string" && key.trim()) {
        const previous = seenKeys[language].get(key);
        if (previous && previous !== relativePath) errors.push(`${relativePath}: duplicate translation_key '${key}' in ${language}`);
        seenKeys[language].set(key, relativePath);
      }
    }

    if (pair["zh-CN"] && pair.en) {
      if (pair["zh-CN"].data.translation_key !== pair.en.data.translation_key) {
        errors.push(`${relativePath}: translation_key values do not match`);
      }
      if (pair["zh-CN"].published !== pair.en.published) {
        errors.push(`${relativePath}: both language versions must share the same publication state`);
      }
      if (pair["zh-CN"].published && pair.en.published) publishedPairs += 1;
    }
  }

  if (paths.size === 0) errors.push("No bilingual posts were found");
  if (errors.length) throw new Error(`Bilingual content validation failed:\n- ${errors.join("\n- ")}`);
  return { languages: LANGUAGE_CODES, pairedPosts: paths.size, publishedPairs };
}

if (require.main === module) {
  try {
    const result = validateBilingualContent();
    console.log(`[bilingual] Validated ${result.pairedPosts} paired article(s), ${result.publishedPairs} published.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { LANGUAGE_CODES, validateBilingualContent };
