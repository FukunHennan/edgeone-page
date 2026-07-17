"use strict";

function assignDefined(target, values) {
  if (!target || !values) return;
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) target[key] = value;
  }
}

function languageFontStyle(language) {
  const chinese = [
    '"PingFang SC"',
    '"Microsoft YaHei"',
    '"Noto Sans CJK SC"',
    '"Source Han Sans SC"',
    "system-ui",
    "sans-serif",
  ].join(", ");
  const english = [
    '"Geist Variable"',
    '"Inter"',
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "sans-serif",
  ].join(", ");
  const selected = language === "en" ? english : chinese;

  return `<style id="edgeone-language-fonts">
html[lang="${language}"] body,
html[lang="${language}"] input,
html[lang="${language}"] button,
html[lang="${language}"] select,
html[lang="${language}"] textarea {
  font-family: ${selected};
}
html[lang="${language}"] code,
html[lang="${language}"] pre {
  font-family: "Geist Mono", "SFMono-Regular", Consolas, monospace;
}
</style>`;
}

hexo.extend.filter.register(
  "before_generate",
  function applyLocalizedTheme() {
    const localized = this.config.localized_theme || {};
    const language = Array.isArray(this.config.language)
      ? this.config.language[0]
      : this.config.language;
    const theme = this.theme.config;

    theme.info = theme.info || {};
    assignDefined(theme.info, {
      title: localized.title || this.config.title,
      subtitle: localized.subtitle || this.config.subtitle,
      author: localized.author || this.config.author,
      url: this.config.url,
    });

    theme.home_banner = theme.home_banner || {};
    assignDefined(theme.home_banner, {
      title: localized.home_banner_title || localized.title || this.config.title,
    });
    theme.home_banner.subtitle = theme.home_banner.subtitle || {};
    if (Array.isArray(localized.home_banner_subtitles)) {
      theme.home_banner.subtitle.text = localized.home_banner_subtitles;
    }

    theme.global = theme.global || {};
    theme.global.open_graph = theme.global.open_graph || {};
    assignDefined(theme.global.open_graph, {
      description: localized.description || this.config.description,
    });

    theme.home = theme.home || {};
    theme.home.sidebar = theme.home.sidebar || {};
    if (localized.announcement) theme.home.sidebar.announcement = localized.announcement;

    theme.articles = theme.articles || {};
    theme.articles.recommendation = theme.articles.recommendation || {};
    if (localized.recommendation_title) {
      theme.articles.recommendation.title = localized.recommendation_title;
    }
    theme.articles.author_label = theme.articles.author_label || {};
    if (localized.author_label) {
      theme.articles.author_label.auto = false;
      theme.articles.author_label.list = [localized.author_label];
    }

    theme.comment = theme.comment || {};
    theme.comment.config = theme.comment.config || {};
    theme.comment.config.giscus = theme.comment.config.giscus || {};
    theme.comment.config.giscus.lang = language;

    theme.footer = theme.footer || {};
    if (localized.footer_html) theme.footer.customize = localized.footer_html;

    theme.inject = theme.inject || {};
    theme.inject.enable = true;
    const existingHead = Array.isArray(theme.inject.head)
      ? theme.inject.head.filter(
          (entry) => typeof entry === "string" && !entry.includes("edgeone-language-fonts"),
        )
      : [];
    theme.inject.head = [...existingHead, languageFontStyle(language)];
  },
  0,
);
