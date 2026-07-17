/* main hexo */

"use strict";

const url = require("url");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { ensurePrefix } = require("./utils/log-prefix");
const { version } = require("../package.json");

const SUPPORTED_LANGUAGES = ["zh-CN", "en"];

/**
 * Export theme config to js
 */
hexo.extend.helper.register("export_config", function () {
  const configuredLanguage = Array.isArray(this.config.language)
    ? this.config.language[0]
    : this.config.language;
  const languageKey = SUPPORTED_LANGUAGES.includes(configuredLanguage)
    ? configuredLanguage
    : "zh-CN";

  const hexo_config = {
    hostname: new URL(this.config.url).hostname || this.config.url,
    root: this.config.root,
    language: languageKey,
  };

  if (this.config.search) {
    hexo_config.path = this.config.search.path;
  }

  const theme_config = {
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
    const text = normalized.text;
    if (Array.isArray(text)) normalized.text = text;
    else if (text) normalized.text = [text];
    else normalized.text = [];
    return normalized;
  };

  const normalizeMermaidTheme = (plugins = {}) => {
    const mermaidConfig = plugins.mermaid || {};
    const themeConfig = mermaidConfig.theme || {};
    const legacyTheme = this.theme?.mermaid?.style || {};
    return {
      light: themeConfig.light || legacyTheme.light || "default",
      dark: themeConfig.dark || legacyTheme.dark || "dark",
    };
  };

  theme_config.home_banner = {
    ...(theme_config.home_banner || {}),
    subtitle: normalizeSubtitle(theme_config.home_banner?.subtitle),
  };

  const mermaidTheme = normalizeMermaidTheme(theme_config.plugins || {});
  theme_config.plugins = {
    ...(theme_config.plugins || {}),
    mermaid: {
      ...(theme_config.plugins?.mermaid || {}),
      theme: mermaidTheme,
    },
  };
  theme_config.mermaid = { style: mermaidTheme };

  const languageDir = path.join(__dirname, "../languages");
  const loadLanguage = (key) => {
    const filePath = path.join(languageDir, `${key}.yml`);
    try {
      return yaml.load(fs.readFileSync(filePath, "utf8")) || {};
    } catch (error) {
      hexo.log.warn(ensurePrefix(`Failed to load language file ${key}.yml: ${error}`));
      return {};
    }
  };

  const allLangs = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((key) => [key, loadLanguage(key)]),
  );
  const languageContent = allLangs[languageKey] || allLangs["zh-CN"] || {};

  const data_config = {
    masonry: Boolean(this.theme.masonry),
  };

  return `<script id="hexo-configurations">
    window.config = ${JSON.stringify(hexo_config)};
    window.theme = ${JSON.stringify(theme_config)};
    window.lang_ago = ${JSON.stringify(languageContent.ago || {})};
    window.i18n = ${JSON.stringify(languageContent)};
    window.data = ${JSON.stringify(data_config)};
    window.allLangs = ${JSON.stringify(allLangs)};
    window.currentLang = ${JSON.stringify(languageKey)};
  </script>`;
});
