"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateBilingualContent } = require("./validate-bilingual");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_ROOT = path.join(PROJECT_ROOT, "public");
const DATABASE_FILE = path.join(PROJECT_ROOT, "db.json");
const HEXO_CLI = path.join(PROJECT_ROOT, "node_modules", "hexo", "bin", "hexo");
const BUILDS = [
  { language: "zh-CN", config: "_config.zh-CN.yml" },
  { language: "en", config: "_config.en.yml" },
];

function removeIfPresent(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function runHexo(configFile) {
  removeIfPresent(DATABASE_FILE);
  const result = spawnSync(
    process.execPath,
    [HEXO_CLI, "generate", "--config", `_config.yml,${configFile}`],
    {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Hexo generation failed for ${configFile}`);
}

function writeLanguageEntry() {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <title>EdgeOne Page</title>
  <script>
    (() => {
      const supported = ["zh-CN", "en"];
      let saved = null;
      try { saved = localStorage.getItem("EDGEONE-LANG"); } catch (_) {}
      const browser = (navigator.language || "").toLowerCase();
      const language = supported.includes(saved) ? saved : (browser.startsWith("zh") ? "zh-CN" : "en");
      location.replace("/" + language + "/");
    })();
  </script>
</head>
<body>
  <p><a href="/zh-CN/">进入简体中文站点</a></p>
  <p><a href="/en/">Open the English site</a></p>
</body>
</html>
`;

  fs.writeFileSync(path.join(PUBLIC_ROOT, "index.html"), html, "utf8");
  fs.writeFileSync(
    path.join(PUBLIC_ROOT, "language-manifest.json"),
    `${JSON.stringify({ default: "zh-CN", supported: ["zh-CN", "en"] }, null, 2)}\n`,
    "utf8",
  );
}

function verifyBuild() {
  for (const build of BUILDS) {
    const indexFile = path.join(PUBLIC_ROOT, build.language, "index.html");
    if (!fs.existsSync(indexFile)) {
      throw new Error(`Missing generated entry: public/${build.language}/index.html`);
    }
  }
}

function main() {
  if (!fs.existsSync(HEXO_CLI)) throw new Error("Hexo is not installed. Run npm ci first.");
  const validation = validateBilingualContent();
  console.log(`[bilingual] Building ${validation.pairedPosts} paired article(s).`);

  removeIfPresent(PUBLIC_ROOT);
  removeIfPresent(DATABASE_FILE);
  fs.mkdirSync(PUBLIC_ROOT, { recursive: true });

  for (const build of BUILDS) {
    console.log(`[bilingual] Generating ${build.language} site...`);
    runHexo(build.config);
  }

  writeLanguageEntry();
  verifyBuild();
  removeIfPresent(DATABASE_FILE);
  console.log("[bilingual] Production output is ready in public/.");
}

try {
  main();
} catch (error) {
  console.error(`[bilingual] ${error.message}`);
  process.exitCode = 1;
}
