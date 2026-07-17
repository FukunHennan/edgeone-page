let searchDataPromise = null;
let searchData = [];
let listenersInitialized = false;
let inputTimer = null;

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const getSearchPath = () => {
  const configured = window.config?.path || "search.json";
  return `${window.config?.root || "/"}${String(configured).replace(/^\/+/, "")}`;
};

const normalizeEntry = (entry) => ({
  title: String(entry.title || "").trim(),
  content: String(entry.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  url: String(entry.url || "").trim(),
});

const loadSearchData = async () => {
  if (searchDataPromise) return searchDataPromise;
  searchDataPromise = fetch(getSearchPath(), { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`Search index request failed with ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      if (!Array.isArray(payload)) throw new Error("Search index must be a JSON array");
      searchData = payload.map(normalizeEntry).filter((entry) => entry.title && entry.url);
      return searchData;
    })
    .catch((error) => {
      searchDataPromise = null;
      console.error("[edgeone-page] Failed to load search index:", error);
      throw error;
    });
  return searchDataPromise;
};

const getDom = () => ({
  input: document.querySelector(".search-input"),
  results: document.getElementById("search-result"),
  overlay: document.querySelector(".search-pop-overlay"),
});

const setEmptyState = (iconClass) => {
  const { results } = getDom();
  if (results) results.innerHTML = `<div id="no-result"><i class="${iconClass} fa-5x"></i></div>`;
};

const closePopup = () => {
  const { overlay } = getDom();
  if (!overlay) return;
  document.body.style.overflow = "";
  overlay.classList.remove("active");
};

const openPopup = async () => {
  const { overlay, input } = getDom();
  if (!overlay || !input) return;
  document.body.style.overflow = "hidden";
  overlay.classList.add("active");
  window.setTimeout(() => input.focus(), 120);
  if (!searchData.length) {
    setEmptyState("fa-solid fa-spinner fa-spin-pulse");
    try {
      await loadSearchData();
      renderResults(input.value);
    } catch (_) {
      setEmptyState("fa-solid fa-triangle-exclamation");
    }
  }
};

const tokenize = (query) => [...new Set(query.toLocaleLowerCase().split(/[\s-]+/).filter(Boolean))];

const makeSnippet = (content, terms) => {
  const lower = content.toLocaleLowerCase();
  let firstIndex = -1;
  for (const term of terms) {
    const index = lower.indexOf(term);
    if (index !== -1 && (firstIndex === -1 || index < firstIndex)) firstIndex = index;
  }
  const start = Math.max(0, firstIndex === -1 ? 0 : firstIndex - 45);
  const end = Math.min(content.length, start + 180);
  let snippet = escapeHtml(content.slice(start, end));
  for (const term of [...terms].sort((a, b) => b.length - a.length)) {
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    snippet = snippet.replace(new RegExp(`(${safeTerm})`, "gi"), '<b class="search-keyword">$1</b>');
  }
  return `${start > 0 ? "…" : ""}${snippet}${end < content.length ? "…" : ""}`;
};

const scoreEntry = (entry, terms) => {
  const title = entry.title.toLocaleLowerCase();
  const content = entry.content.toLocaleLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title === term) score += 20;
    else if (title.includes(term)) score += 8;
    score += Math.min(content.split(term).length - 1, 8);
  }
  return score;
};

const renderResults = (rawQuery) => {
  const { results } = getDom();
  if (!results) return;
  const terms = tokenize(String(rawQuery || "").trim());
  if (!terms.length) {
    setEmptyState("fa-solid fa-magnifying-glass");
    return;
  }
  const matches = searchData
    .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title))
    .slice(0, 30);
  if (!matches.length) {
    setEmptyState("fa-solid fa-box-open");
    return;
  }
  results.innerHTML = `<ul class="search-result-list">${matches.map(({ entry }) => `
    <li>
      <a href="${escapeHtml(entry.url)}" class="search-result-title">${escapeHtml(entry.title)}</a>
      <a href="${escapeHtml(entry.url)}"><p class="search-result">${makeSnippet(entry.content, terms)}</p></a>
    </li>`).join("")}</ul>`;
  window.pjax?.refresh?.(results);
};

const handleInput = (event) => {
  if (!event.target.matches(".search-input")) return;
  window.clearTimeout(inputTimer);
  inputTimer = window.setTimeout(() => renderResults(event.target.value), 80);
};

const handleClick = (event) => {
  if (event.target.closest(".search-popup-trigger")) return void openPopup();
  const overlay = event.target.closest(".search-pop-overlay");
  if (overlay && event.target === overlay) return void closePopup();
  if (event.target.closest(".search-input-field-pre")) {
    const { input } = getDom();
    if (input) {
      input.value = "";
      input.focus();
      renderResults("");
    }
    return;
  }
  if (event.target.closest(".popup-btn-close")) closePopup();
};

const handleKeyup = (event) => {
  if (event.key === "Escape") closePopup();
};

export const initLocalSearchGlobals = ({ signal } = {}) => {
  if (listenersInitialized) return;
  listenersInitialized = true;
  const options = signal ? { signal } : undefined;
  document.addEventListener("input", handleInput, options);
  document.addEventListener("click", handleClick, options);
  window.addEventListener("keyup", handleKeyup, options);
};

export const initLocalSearchPage = () => {
  closePopup();
  if (window.theme?.navbar?.search?.preload) loadSearchData().catch(() => {});
};
