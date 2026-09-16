"use strict";

const { spawn } = require("child_process");

const lang = process.argv.includes("--en") ? "en" : "zh-CN";
const config = lang === "en" ? "_config.yml,_config.en.yml" : "_config.yml,_config.zh-CN.yml";
const portArg = process.argv.find((arg) => arg.startsWith("--port="));
const port = portArg ? portArg.split("=")[1] : "4000";

console.log(`[dev] Starting fast ${lang} preview on http://127.0.0.1:${port}/${lang}/`);
console.log("[dev] This skips the bilingual production build and audit. Use npm run check before a release.");

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["hexo", "server", "--config", config, "--port", port],
  { stdio: "inherit", shell: false }
);

child.on("exit", (code) => process.exit(code ?? 0));
