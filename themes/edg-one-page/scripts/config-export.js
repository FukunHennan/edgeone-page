/* main hexo */

"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { ensurePrefix } = require("./utils/log-prefix");
const { version } = require("../package.json");

hexo.extend.helper.register("export_config", function () {
  const languageKey = Array.isArray(this.config.language)
    ? this.config.language[0]
    : this.config.language;

  const hexoConfig = {
    hostname: new URL(this.config.url).hostname || this.config.url,
    root: this.config.root,
    language: languageKey,
  };

  if (this.config.search) hexoConfig.path = this.config.search.path;

  const themeConfig = {
    articles: this.theme.articles,
    colors: this.theme.colors,
    global: this.theme.global,
    home_banner: this.theme.home_banner,
    plugins: this.theme.plugins,
    version,
    code_block: this.theme.code_block,
    navbar: this.theme.navbar,
    page_templates: this.theme.page_templates,
    home: this.theme.home,
    footer: this.theme.footer,
    footerStart: this.theme.footer?.start,
  };

  const normalizeSubtitle = (subtitle) => {
    if (Array.isArray(subtitle)) return { text: subtitle };
    const normalized = { ...(subtitle || {}) };
    normalized.text = Array.isArray(normalized.text)
      ? normalized.text
      : normalized.text
        ? [normalized.text]
        : [];
    return normalized;
  };

  const normalizeMermaidTheme = (plugins = {}) => {
    const mermaidConfig = plugins.mermaid || {};
    const themeValue = mermaidConfig.theme || {};
    const legacyTheme = this.theme?.mermaid?.style || {};
    return {
      light: themeValue.light || legacyTheme.light || "default",
      dark: themeValue.dark || legacyTheme.dark || "dark",
    };
  };

  themeConfig.home_banner = {
    ...(themeConfig.home_banner || {}),
    subtitle: normalizeSubtitle(themeConfig.home_banner?.subtitle),
  };

  const mermaidTheme = normalizeMermaidTheme(themeConfig.plugins || {});
  themeConfig.plugins = {
    ...(themeConfig.plugins || {}),
    mermaid: {
      ...(themeConfig.plugins?.mermaid || {}),
      theme: mermaidTheme,
    },
  };
  themeConfig.mermaid = { style: mermaidTheme };

  const languageDir = path.join(__dirname, "../languages");
  const languageFile = path.join(languageDir, `${languageKey}.yml`);
  const fallbackFile = path.join(languageDir, "en.yml");
  const selectedFile = fs.existsSync(languageFile) ? languageFile : fallbackFile;
  let languageContent = {};

  try {
    languageContent = yaml.load(fs.readFileSync(selectedFile, "utf8")) || {};
  } catch (error) {
    hexo.log.warn(ensurePrefix(`Failed to parse language file: ${error}`));
  }

  const dataConfig = {
    masonry: Boolean(this.theme.masonry),
  };

  return `<script id="hexo-configurations">
    window.config = ${JSON.stringify(hexoConfig)};
    window.theme = ${JSON.stringify(themeConfig)};
    window.lang_ago = ${JSON.stringify(languageContent.ago || {})};
    window.i18n = ${JSON.stringify(languageContent)};
    window.data = ${JSON.stringify(dataConfig)};
    window.currentLang = ${JSON.stringify(languageKey)};
  </script>`;
});
