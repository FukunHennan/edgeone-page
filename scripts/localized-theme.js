"use strict";

function assignDefined(target, values) {
  if (!target || !values) return;
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) target[key] = value;
  }
}

hexo.extend.filter.register(
  "before_generate",
  function applyLocalizedTheme() {
    const localized = this.config.localized_theme || {};
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

    theme.comment = theme.comment || {};
    theme.comment.config = theme.comment.config || {};
    theme.comment.config.giscus = theme.comment.config.giscus || {};
    theme.comment.config.giscus.lang = this.config.language;

    theme.footer = theme.footer || {};
    if (localized.footer_html) theme.footer.customize = localized.footer_html;
  },
  0,
);
