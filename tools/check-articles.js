"use strict";

const { collectLanguagePosts } = require("./content-records");

const errors = [];
const warnings = [];
const counts = new Map();

for (const language of ["zh-CN", "en"]) {
  for (const record of collectLanguagePosts(language)) {
    const type = String(record.data.content_type || "article").trim() || "article";
    const domain = String(record.data.domain || "unclassified").trim() || "unclassified";
    counts.set(`${type}/${domain}`, (counts.get(`${type}/${domain}`) || 0) + 1);

    if (!record.data.content_type) warnings.push(`${record.relativePath}: missing content_type (defaults to article)`);
    if (!record.data.domain) warnings.push(`${record.relativePath}: missing domain`);
    if (/<style\b/i.test(record.rawBody)) errors.push(`${record.relativePath}: inline <style> is not allowed`);
    if (/<script\b/i.test(record.rawBody)) errors.push(`${record.relativePath}: inline <script> is not allowed`);
    if (/{%\s*(note|notes|subnote|noteL|notel|notelarge|notel-large|notes-large|subwarning)\b/i.test(record.rawBody)) {
      errors.push(`${record.relativePath}: legacy note tag found; use callout`);
    }
  }
}

if (errors.length) {
  console.error(`Article architecture check failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`[articles] Checked ${[...counts.values()].reduce((sum, value) => sum + value, 0)} language article(s).`);
  for (const [key, value] of [...counts.entries()].sort()) console.log(`[articles] ${key}: ${value}`);
  if (warnings.length) {
    console.log(`[articles] ${warnings.length} migration warning(s):`);
    for (const warning of warnings) console.log(`- ${warning}`);
  }
}
