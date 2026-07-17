"use strict";

hexo.extend.filter.register("before_generate", function enableStaticFeatures() {
  this.config.path = "search.json";
  this.config.feed = {
    ...(this.config.feed || {}),
    path: "feed.xml",
  };

  const theme = this.theme.config;
  theme.navbar = theme.navbar || {};
  theme.navbar.search = {
    ...(theme.navbar.search || {}),
    enable: true,
    preload: true,
    top_n_per_article: 2,
  };

  theme.plugins = theme.plugins || {};
  theme.plugins.feed = {
    ...(theme.plugins.feed || {}),
    enable: true,
  };
});
