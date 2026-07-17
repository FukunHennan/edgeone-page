"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateBilingualContent } = require("./validate-bilingual");
const { postprocessBilingualSite } = require("./postprocess-bilingual");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_ROOT = path.join(PROJECT_ROOT, "public");
const DATABASE_FILE = path.join(PROJECT_ROOT, "db.json");
const HEXO_CLI = path.join(PROJECT_ROOT, "node_modules", "hexo", "bin", "hexo");
const BUILDS = [
  { language: "zh-CN", config: "_config.zh-CN.yml" },
  { language: "en", config: "_config.en.yml" },
];
const FORBIDDEN_OUTPUT = [
  "zh-TW",
  "繁體中文",
  "window.allLangs",
  "EdgeOneLanguage.apply",
  "data-i18n-upper",
  "data-i18n-placeholder",
];
const REQUIRED_FEATURES = [
  "robots.txt",
  "sitemap.xml",
  "404.html",
  "zh-CN/search.json",
  "en/search.json",
  "zh-CN/feed.xml",
  "en/feed.xml",
  "zh-CN/sitemap.xml",
  "en/sitemap.xml",
  "zh-CN/404.html",
  "en/404.html",
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
      try {
        saved = localStorage.getItem("EDGEONE-LANG");
        localStorage.removeItem("REDEFINE-LANG");
      } catch (_) {}
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

function walkHtml(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(absolutePath));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolutePath);
  }
  return files;
}

function verifyBuild() {
  for (const relativePath of REQUIRED_FEATURES) {
    if (!fs.existsSync(path.join(PUBLIC_ROOT, relativePath))) {
      throw new Error(`Missing generated feature: public/${relativePath}`);
    }
  }

  for (const build of BUILDS) {
    const outputRoot = path.join(PUBLIC_ROOT, build.language);
    const indexFile = path.join(outputRoot, "index.html");
    if (!fs.existsSync(indexFile)) {
      throw new Error(`Missing generated entry: public/${build.language}/index.html`);
    }

    const indexHtml = fs.readFileSync(indexFile, "utf8");
    if (!indexHtml.includes('hreflang="zh-CN"') || !indexHtml.includes('hreflang="en"')) {
      throw new Error(`public/${build.language}/index.html is missing bilingual hreflang links`);
    }

    for (const filePath of walkHtml(outputRoot)) {
      const html = fs.readFileSync(filePath, "utf8");
      const expectedLang = `lang="${build.language}"`;
      if (!html.includes(expectedLang)) {
        throw new Error(`${path.relative(PROJECT_ROOT, filePath)} does not declare ${expectedLang}`);
      }
      for (const forbidden of FORBIDDEN_OUTPUT) {
        if (html.includes(forbidden)) {
          throw new Error(`${path.relative(PROJECT_ROOT, filePath)} still contains forbidden legacy language token: ${forbidden}`);
        }
      }
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
  const features = postprocessBilingualSite();
  console.log(`[bilingual] Generated feature set: ${JSON.stringify(features)}`);
  verifyBuild();
  removeIfPresent(DATABASE_FILE);
  console.log("[bilingual] Production output passed language and feature audits.");
}

try {
  main();
} catch (error) {
  console.error(`[bilingual] ${error.message}`);
  process.exitCode = 1;
}
