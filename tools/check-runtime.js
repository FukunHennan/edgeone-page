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

const failures = [];
if (actualNode !== expectedNode) failures.push(`Node.js must be ${expectedNode}, got ${actualNode}`);
if (expectedNpm && actualNpm && actualNpm !== expectedNpm) failures.push(`npm must be ${expectedNpm}, got ${actualNpm}`);

if (failures.length) {
  console.error(`[runtime] ${failures.join("; ")}`);
  console.error("[runtime] Use Node.js 22.11.0 before running local checks or builds.");
  process.exitCode = 1;
} else {
  console.log(`[runtime] Node.js ${actualNode}${actualNpm ? `, npm ${actualNpm}` : ""} matches EdgeOne cloud runtime.`);
}
