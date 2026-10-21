import initMimoInspired from '../../themes/edg-one-page/source/js/layouts/mimoInspired.js';
import initWorkspaces from '../../themes/edg-one-page/source/js/layouts/personalHubWorkspaces.js';
import { initArticleToc } from './article-toc';
import { initCalmCarousel } from './calm-carousel';
type SwupInstance = { hooks: { on: (event: string, callback: () => void) => void; before: (event: string, callback: () => void) => void } };
const globals = window as unknown as Record<string, new (options?: Record<string, unknown>) => unknown>;
let pageScope = new AbortController();
function initPage() {
  pageScope.abort(); pageScope = new AbortController(); const signal = pageScope.signal;
  initMimoInspired({ signal }); initWorkspaces({ signal }); initArticleToc(signal); initCalmCarousel(signal);
  const backLink = document.querySelector<HTMLAnchorElement>('[data-history-back]');
  const backLabel = backLink?.querySelector('[data-history-back-label]');
  const state = history.state || {};
  let cameFromSite = false;
  try { const referrer = new URL(document.referrer); cameFromSite = referrer.origin === location.origin && referrer.href !== location.href && history.length > 1; } catch {}
  // A new tab can have an about:blank history entry. Length alone is insufficient.
  const canGoBack = typeof state.hubCanGoBack === 'boolean' ? state.hubCanGoBack : (state.source === 'swup' && state.index > 1) || cameFromSite;
  history.replaceState({ ...state, hubCanGoBack: canGoBack }, '', location.href);
  if (backLabel) backLabel.textContent = document.documentElement.lang === 'zh-CN' ? (canGoBack ? '返回上一页' : '返回首页') : (canGoBack ? 'Go back' : 'Back to home');
  backLink?.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !canGoBack) return;
    event.preventDefault();
    history.back();
  }, { signal });
  document.querySelectorAll('.tool-dark-light-toggle').forEach((button) => button.addEventListener('click', () => {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark); document.documentElement.classList.toggle('light', !dark); document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    try { localStorage.setItem('REDEFINE-THEME-STATUS', JSON.stringify({ isDark: dark })); } catch {}
  }, { signal }));
  const menuButton = document.querySelector<HTMLButtonElement>('.navbar-bar');
  const setMenuOpen = (open: boolean) => {
    document.documentElement.classList.toggle('astro-menu-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
  };
  menuButton?.addEventListener('click', () => setMenuOpen(!document.documentElement.classList.contains('astro-menu-open')), { signal });
  document.querySelector('.window-mask')?.addEventListener('click', () => setMenuOpen(false), { signal });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.documentElement.classList.contains('astro-menu-open')) {
      setMenuOpen(false);
      menuButton?.focus();
    }
  }, { signal });
  // Language switching in the mobile drawer; localized routes share article slugs.
  document.querySelector<HTMLSelectElement>('.lang-select-mobile')?.addEventListener('change', (event) => {
    const selected = (event.currentTarget as HTMLSelectElement).value;
    if (selected !== 'zh-CN' && selected !== 'en') return;
    const remaining = location.pathname.replace(/^\/(?:zh-CN|en)(?=\/|$)/, '') || '/';
    location.assign(`/${selected}${remaining}`);
  }, { signal });
  const language = document.documentElement.lang;
  const isZh = language === 'zh-CN';
  const dialog = document.querySelector<HTMLDialogElement>('#astro-search');
  const input = document.querySelector<HTMLInputElement>('#astro-search-input');
  const list = document.querySelector<HTMLUListElement>('#astro-search-results');
  let searchData: { title: string; url: string; description: string }[] | undefined;
  let searchLoading = false;
  let searchError = false;
  const message = (value: string) => {
    if (!list) return;
    const item = document.createElement('li');
    item.className = 'search-feedback';
    item.textContent = value;
    list.replaceChildren(item);
  };
  const renderResults = () => {
    if (!list || !input) return;
    const query = input.value.trim().toLocaleLowerCase();
    if (searchLoading) { message(isZh ? '正在载入搜索索引…' : 'Loading search index…'); return; }
    if (searchError) { message(isZh ? '搜索加载失败，请重新打开搜索重试。' : 'Search failed. Reopen search to retry.'); return; }
    if (!query) { message(isZh ? '输入关键词搜索文章和笔记' : 'Type to search articles and notes'); return; }
    if (!searchData) return;
    const matches = searchData.filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase().includes(query)).slice(0, 30);
    if (!matches.length) { message(isZh ? '没有找到匹配的内容' : 'No matching results'); return; }
    const results = matches.map((item) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.title;
      li.append(link);
      return li;
    });
    list.replaceChildren(...results);
  };
  document.querySelectorAll('.search-popup-trigger').forEach((button) => button.addEventListener('click', async () => {
    if (!dialog || !input) return;
    if (!dialog.open) dialog.showModal();
    input.focus();
    if (searchData || searchLoading) { renderResults(); return; }
    searchLoading = true; searchError = false; renderResults();
    try {
      const response = await fetch(`/${language}/search.json`, { signal });
      if (!response.ok) throw new Error('Search unavailable');
      searchData = await response.json();
    } catch {
      if (!signal.aborted) searchError = true;
    } finally {
      searchLoading = false;
      if (!signal.aborted) renderResults();
    }
  }, { signal }));
  input?.addEventListener('input', renderResults, { signal });
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      const firstResult = list?.querySelector<HTMLAnchorElement>('a');
      if (firstResult) { event.preventDefault(); firstResult.focus(); }
    }
  }, { signal });
}
initPage();
if (globals.Swup && !location.pathname.includes('/resume/')) {
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const plugins = ['SwupProgressPlugin','SwupScrollPlugin','SwupPreloadPlugin'].filter((name) => globals[name]).map((name) => new globals[name](name === 'SwupScrollPlugin' ? { offset: 96 } : {}));
  if (!reduced && globals.SwupSlideTheme) plugins.push(new globals.SwupSlideTheme({ mainElement: '.main-content-body' }));
  const swup = new globals.Swup({ containers: ['#swup'], plugins, linkSelector: 'a[href]:not([href*="/resume/"]):not([lang])' }) as SwupInstance;
  swup.hooks.before('content:replace', () => { pageScope.abort(); document.documentElement.classList.remove('astro-menu-open'); }); swup.hooks.on('page:view', initPage);
}
