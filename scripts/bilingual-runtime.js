"use strict";

const SUPPORTED_LANGUAGES = Object.freeze(["zh-CN", "en"]);
const LANGUAGE_PATH_PATTERN = /^\/(zh-CN|en)(?=\/|$)/;

function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : "zh-CN";
}

function languageFromConfig(config) {
  const language = Array.isArray(config.language) ? config.language[0] : config.language;
  return normalizeLanguage(language);
}

hexo.extend.filter.register("after_render:html", function injectBilingualNavigation(html) {
  if (typeof html !== "string") return html;

  const buildLanguage = languageFromConfig(this.config);
  const runtime = `<script data-bilingual-navigation>
(() => {
  const supported = ["zh-CN", "en"];
  const storageKey = "EDGEONE-LANG";
  const pathPattern = /^\\/(zh-CN|en)(?=\\/|$)/;

  const getCurrentLanguage = () => {
    const match = location.pathname.match(pathPattern);
    return match ? match[1] : ${JSON.stringify(buildLanguage)};
  };

  const syncLanguageControls = () => {
    const current = getCurrentLanguage();
    document.documentElement.lang = current;

    document.querySelectorAll(".lang-select").forEach((select) => {
      select.value = current;
      select.setAttribute("aria-label", current === "en" ? "Language" : "语言");
    });

    try {
      localStorage.setItem(storageKey, current);
      localStorage.removeItem("REDEFINE-LANG");
    } catch (_) {}
  };

  if (!window.__EDGEONE_BILINGUAL_NAVIGATION__) {
    window.__EDGEONE_BILINGUAL_NAVIGATION__ = true;

    document.addEventListener("change", (event) => {
      const select = event.target.closest?.(".lang-select");
      if (!select || !supported.includes(select.value)) return;

      const current = getCurrentLanguage();
      const target = select.value;
      if (target === current) return;

      try {
        localStorage.setItem(storageKey, target);
        localStorage.removeItem("REDEFINE-LANG");
      } catch (_) {}

      const targetPath = pathPattern.test(location.pathname)
        ? location.pathname.replace(pathPattern, "/" + target)
        : "/" + target + "/";

      location.assign(targetPath + location.search + location.hash);
    }, true);

    window.addEventListener("redefine:page:refresh", syncLanguageControls);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncLanguageControls, { once: true });
  } else {
    syncLanguageControls();
  }
})();
</script>`;

  let output = html;
  output = output.replace(/<html(?:\s+lang=["'][^"']*["'])?/i, `<html lang="${buildLanguage}"`);
  if (!output.includes("data-bilingual-navigation") && output.includes("</body>")) {
    output = output.replace("</body>", `${runtime}</body>`);
  }
  return output;
});

module.exports = { SUPPORTED_LANGUAGES };
