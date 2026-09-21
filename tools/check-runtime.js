"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const pkg = require(path.join(ROOT, "package.json"));
const edgeone = JSON.parse(fs.readFileSync(path.join(ROOT, "edgeone.json"), "utf8"));

const expectedNode = edgeone.nodeVersion;
const expectedNpm = String(pkg.packageManager || "").replace(/^npm@/, "");
const actualNode = process.versions.node;
const actualNpm = process.env.npm_config_user_agent?.match(/npm\/([^\s]+)/)?.[1] || "";

const versionParts = (version) => String(version).split(".").map((part) => Number(part) || 0);
const versionAtLeast = (actual, minimum) => {
  const actualParts = versionParts(actual);
  const minimumParts = versionParts(minimum);
  for (let index = 0; index < Math.max(actualParts.length, minimumParts.length); index += 1) {
    if ((actualParts[index] || 0) > (minimumParts[index] || 0)) return true;
    if ((actualParts[index] || 0) < (minimumParts[index] || 0)) return false;
  }
  return true;
};

const failures = [];
const expectedMajor = versionParts(expectedNode)[0];
const actualMajor = versionParts(actualNode)[0];
if (actualMajor !== expectedMajor || !versionAtLeast(actualNode, expectedNode)) {
  failures.push(`Node.js must be compatible with ${expectedNode} (${expectedMajor}.x), got ${actualNode}`);
}
if (expectedNpm && actualNpm && actualNpm !== expectedNpm) failures.push(`npm must be ${expectedNpm}, got ${actualNpm}`);

if (failures.length) {
  console.error(`[runtime] ${failures.join("; ")}`);
  console.error(`[runtime] Use Node.js ${expectedNode} or a newer ${expectedMajor}.x release before running local checks or builds.`);
  process.exitCode = 1;
} else {
  console.log(`[runtime] Node.js ${actualNode}${actualNpm ? `, npm ${actualNpm}` : ""} is compatible with EdgeOne Node.js ${expectedNode}.`);
}
