const STORAGE_KEY = "EDGEONE-LANG";
const SUPPORTED_LANGUAGES = ["zh-CN", "en"];
const LANGUAGE_PATH_PATTERN = /^\/(zh-CN|en)(?=\/|$)/;

const currentLanguage = () => {
  const pathMatch = window.location.pathname.match(LANGUAGE_PATH_PATTERN);
  if (pathMatch) return pathMatch[1];

  const configured = Array.isArray(window.config?.language)
    ? window.config.language[0]
    : window.config?.language;
  return SUPPORTED_LANGUAGES.includes(configured) ? configured : "zh-CN";
};

const persistLanguage = (language) => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
    localStorage.removeItem("REDEFINE-LANG");
  } catch (error) {
    console.warn("[edgeone-page] Unable to save language preference:", error);
  }
};

const syncSelectors = () => {
  const language = currentLanguage();
  document.documentElement.lang = language;
  document.querySelectorAll(".lang-select").forEach((selector) => {
    selector.value = language;
    selector.setAttribute("aria-label", language === "en" ? "Language" : "语言");
  });
  persistLanguage(language);
};

const switchLanguage = (language) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) return;

  const current = currentLanguage();
  if (language === current) return;
  persistLanguage(language);

  const pathname = LANGUAGE_PATH_PATTERN.test(window.location.pathname)
    ? window.location.pathname.replace(LANGUAGE_PATH_PATTERN, `/${language}`)
    : `/${language}/`;

  window.location.assign(`${pathname}${window.location.search}${window.location.hash}`);
};

const initLangSwitch = ({ signal } = {}) => {
  const selectors = document.querySelectorAll(".lang-select");
  if (!selectors.length) return;

  syncSelectors();
  selectors.forEach((selector) => {
    selector.addEventListener("change", () => switchLanguage(selector.value), signal ? { signal } : undefined);
  });
};

export default initLangSwitch;
