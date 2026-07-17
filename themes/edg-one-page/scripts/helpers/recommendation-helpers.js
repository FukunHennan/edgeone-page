"use strict";

let recommendationSet = null;

function toArray(collection) {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (typeof collection.toArray === "function") return collection.toArray();
  const items = [];
  if (typeof collection.each === "function") collection.each((item) => items.push(item));
  return items;
}

function taxonomyNames(collection) {
  return new Set(
    toArray(collection)
      .map((item) => (typeof item === "string" ? item : item?.name))
      .filter(Boolean)
      .map((item) => String(item).toLocaleLowerCase()),
  );
}

function tokenize(value) {
  const text = String(value || "")
    .toLocaleLowerCase()
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
  const tokens = new Set(text.match(/[a-z0-9][a-z0-9_-]{1,}/g) || []);
  const cjkSegments = text.match(/[\u3400-\u9fff]+/g) || [];
  for (const segment of cjkSegments) {
    if (segment.length === 1) tokens.add(segment);
    for (let index = 0; index < segment.length - 1; index += 1) {
      tokens.add(segment.slice(index, index + 2));
    }
  }
  return new Set([...tokens].slice(0, 2500));
}

function intersectionSize(left, right) {
  let count = 0;
  for (const value of left) if (right.has(value)) count += 1;
  return count;
}

function contentSimilarity(left, right) {
  if (!left.size || !right.size) return 0;
  const overlap = intersectionSize(left, right);
  return overlap / Math.sqrt(left.size * right.size);
}

function prepareArticle(post, cfg) {
  const title = post.title || post.seo_title || post.short_title || post.path;
  return {
    path: post.path,
    title,
    headimg: post.thumbnail || post.banner || post.cover || cfg.placeholder,
    tags: taxonomyNames(post.tags),
    categories: taxonomyNames(post.categories),
    tokens: tokenize(`${title}\n${post.raw || post.content || ""}`),
    date: new Date(post.date || 0).getTime() || 0,
  };
}

function scoreCandidate(source, candidate) {
  const sharedTags = intersectionSize(source.tags, candidate.tags);
  const sharedCategories = intersectionSize(source.categories, candidate.categories);
  const semantic = contentSimilarity(source.tokens, candidate.tokens);
  const ageDays = Math.abs(source.date - candidate.date) / 86400000;
  const recency = Math.max(0, 1 - ageDays / 3650);
  return sharedTags * 12 + sharedCategories * 7 + semantic * 24 + recency;
}

function buildRecommendationSet(posts, pages, cfg) {
  const articles = [...toArray(posts), ...toArray(pages)]
    .filter((post) => ["post", "docs"].includes(post.layout))
    .map((post) => prepareArticle(post, cfg));
  const set = {};
  for (const source of articles) {
    set[source.path] = articles
      .filter((candidate) => candidate.path !== source.path)
      .map((candidate) => ({ candidate, score: scoreCandidate(source, candidate) }))
      .sort((left, right) => right.score - left.score || right.candidate.date - left.candidate.date)
      .slice(0, Math.max(0, Number(cfg.limit) || 3))
      .map(({ candidate }) => candidate);
  }
  return set;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function itemInterface(item) {
  const url = hexo.extend.helper.get("url_for").call(hexo, item.path);
  return `<a class="recommended-article-item" href="${escapeHtml(url)}" title="${escapeHtml(item.title)}" rel="bookmark">
  <img src="${escapeHtml(item.headimg)}" alt="${escapeHtml(item.title)}" class="!max-w-none" loading="lazy" decoding="async">
  <span class="title">${escapeHtml(item.title)}</span>
</a>`;
}

function userInterface(recommendedArticles, cfg) {
  if (!Array.isArray(recommendedArticles) || recommendedArticles.length === 0) return "";
  const desktop = recommendedArticles.map(itemInterface).join("");
  const mobile = recommendedArticles
    .slice(0, Math.max(1, Number(cfg.mobile_limit) || 2))
    .map(itemInterface)
    .join("");
  const title = escapeHtml(cfg.title || "Recommended reading");
  return `
  <section class="recommended-article px-2 sm:px-6 md:px-8" aria-labelledby="recommended-article-title">
    <div class="recommended-desktop">
      <h2 id="recommended-article-title" class="recommended-article-header text-xl md:text-3xl font-bold mt-10"><span>${title}</span></h2>
      <div class="recommended-article-group">${desktop}</div>
    </div>
    <div class="recommended-mobile">
      <h2 class="recommended-article-header text-xl md:text-3xl font-bold mt-10"><span>${title}</span></h2>
      <div class="recommended-article-group">${mobile}</div>
    </div>
  </section>`;
}

hexo.extend.filter.register("template_locals", function (locals) {
  const cfg = hexo.theme.config.articles.recommendation;
  if (!cfg?.enable) return locals;
  if (!recommendationSet) {
    recommendationSet = buildRecommendationSet(locals.site.posts, locals.site.pages, cfg);
    hexo.locals.set("recommendationSet", () => recommendationSet);
  }
  return locals;
});

hexo.extend.helper.register("articleRecommendationGenerator", function (post) {
  const cfg = hexo.theme.config.articles.recommendation;
  if (!post || !cfg?.enable) return "";
  for (const directory of cfg.skip_dirs || []) {
    if (new RegExp(`^${directory}`).test(post.path)) return "";
  }
  const set = recommendationSet || hexo.locals.get("recommendationSet") || {};
  return userInterface(set[post.path] || [], cfg);
});

module.exports = { buildRecommendationSet, tokenize };
