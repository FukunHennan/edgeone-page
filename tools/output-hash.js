"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(target));
    else if (entry.isFile()) files.push(target);
  }
  return files.sort();
}

function stableOutputHash(publicRoot, options = {}) {
  const excluded = new Set(options.exclude || ["service-worker.js", ".DS_Store"]);
  const hash = crypto.createHash("sha256");
  for (const file of walkFiles(publicRoot)) {
    const relative = path.relative(publicRoot, file).split(path.sep).join("/");
    if (excluded.has(relative) || excluded.has(path.basename(relative))) continue;
    hash.update(relative);
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, options.length || 16);
}

module.exports = { stableOutputHash, walkFiles };
