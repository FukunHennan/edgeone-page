"use strict";

const SUPPORTED_LANGUAGES = ["zh-CN", "en"];

function currentLanguageFromPath(pathname) {
  const match = String(pathname || "").match(/^\/(zh-CN|en)(?:\/|$)/);
  return match ? match[1] : "zh-CN";
}

hexo.extend.filter.register("after_render:html", function injectBilingualRuntime(html) {
  if (typeof html !== "string") return html;

  const language = currentLanguageFromPath(this.config.root || "");
  const bootstrap = `<script data-bilingual-bootstrap>
(() => {
  const current = ${JSON.stringify(language)};
  try {
    localStorage.setItem("EDGEONE-LANG", current);
    localStorage.setItem("REDEFINE-LANG", current);
  } catch (_) {}
  document.documentElement.lang = current;
})();
</script>`;

  const runtime = `<script data-bilingual-runtime>
(() => {
  const supported = ${JSON.stringify(SUPPORTED_LANGUAGES)};
  const storageKey = "EDGEONE-LANG";
  const currentMatch = location.pathname.match(/^\\/(zh-CN|en)(?:\\/|$)/);
  const current = currentMatch ? currentMatch[1] : ${JSON.stringify(language)};

  document.documentElement.lang = current;
  document.querySelectorAll(".lang-select").forEach((select) => {
    Array.from(select.options).forEach((option) => {
      if (!supported.includes(option.value)) option.remove();
    });
    select.value = current;
    select.setAttribute("aria-label", current === "en" ? "Language" : "语言");
  });

  if (window.EdgeOneLanguage?.apply) {
    window.EdgeOneLanguage.apply(current, false);
  }

  document.addEventListener("change", (event) => {
    const select = event.target.closest?.(".lang-select");
    if (!select || !supported.includes(select.value)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const targetLanguage = select.value;
    try {
      localStorage.setItem(storageKey, targetLanguage);
      localStorage.setItem("REDEFINE-LANG", targetLanguage);
    } catch (_) {}

    if (targetLanguage === current) return;

    let targetPath = location.pathname.replace(
      /^\\/(?:zh-CN|en)(?=\\/|$)/,
      "/" + targetLanguage,
    );
    if (targetPath === location.pathname) targetPath = "/" + targetLanguage + "/";
    location.assign(targetPath + location.search + location.hash);
  }, true);
})();
</script>`;

  let output = html.replace(
    /<option\s+value=["']zh-TW["'][^>]*>[^<]*<\/option>/gi,
    "",
  );

  if (output.includes("</head>")) output = output.replace("</head>", `${bootstrap}</head>`);
  if (output.includes("</body>")) output = output.replace("</body>", `${runtime}</body>`);
  return output;
});
