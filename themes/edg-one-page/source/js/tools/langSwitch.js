const LANG_STORAGE_KEY = "REDEFINE-LANG";

const getSavedLang = () => {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY);
  } catch (e) {
    return null;
  }
};

const saveLang = (lang) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {
    console.warn("[redefine] Failed to save language preference:", e);
  }
};

const getNestedValue = (obj, key) => {
  if (!obj || !key) {
    return undefined;
  }

  const parts = key.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }
  return current;
};

const applyLang = (lang) => {
  const langData = window.allLangs?.[lang];
  if (!langData) {
    return;
  }

  window.i18n = langData;
  window.lang_ago = langData.ago || {};
  window.currentLang = lang;
  document.documentElement.setAttribute("lang", lang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = getNestedValue(langData, key);
    if (value !== undefined && typeof value === "string") {
      el.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    const value = getNestedValue(langData, key);
    if (value !== undefined && typeof value === "string") {
      el.innerHTML = value;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const value = getNestedValue(langData, key);
    if (value !== undefined && typeof value === "string") {
      el.setAttribute("placeholder", value);
    }
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    const value = getNestedValue(langData, key);
    if (value !== undefined && typeof value === "string") {
      el.setAttribute("aria-label", value);
    }
  });

  document.querySelectorAll("[data-i18n-upper]").forEach((el) => {
    const key = el.getAttribute("data-i18n-upper");
    const value = getNestedValue(langData, key);
    if (value !== undefined && typeof value === "string") {
      el.textContent = value.toUpperCase();
    }
  });

  syncAllSelects(lang);
};

const syncAllSelects = (lang) => {
  document.querySelectorAll(".lang-select").forEach((sel) => {
    if (sel.value !== lang) {
      sel.value = lang;
    }
  });
};

const initLangSwitch = ({ signal } = {}) => {
  const selects = document.querySelectorAll(".lang-select");
  if (!selects.length) {
    return;
  }

  if (!window.allLangs || Object.keys(window.allLangs).length < 2) {
    selects.forEach((sel) => { sel.style.display = "none"; });
    return;
  }

  const savedLang = getSavedLang();
  if (savedLang && window.allLangs[savedLang]) {
    applyLang(savedLang);
  }

  selects.forEach((sel) => {
    const handler = () => {
      const lang = sel.value;
      saveLang(lang);
      applyLang(lang);
    };

    if (signal) {
      sel.addEventListener("change", handler, { signal });
    } else {
      sel.addEventListener("change", handler);
    }
  });
};

export default initLangSwitch;
