import initMimoInspired from '../../themes/edg-one-page/source/js/layouts/mimoInspired.js';
import initWorkspaces from '../../themes/edg-one-page/source/js/layouts/personalHubWorkspaces.js';
type SwupInstance = { hooks: { on: (event: string, callback: () => void) => void; before: (event: string, callback: () => void) => void } };
const globals = window as unknown as Record<string, new (options?: Record<string, unknown>) => unknown>;
let pageScope = new AbortController();
function initPage() {
  pageScope.abort(); pageScope = new AbortController(); const signal = pageScope.signal;
  initMimoInspired({ signal }); initWorkspaces();
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
  document.querySelector('.navbar-bar')?.addEventListener('click', () => document.documentElement.classList.toggle('astro-menu-open'), { signal });
  const language = document.documentElement.lang;
  const dialog = document.querySelector<HTMLDialogElement>('#astro-search'); const input = document.querySelector<HTMLInputElement>('#astro-search-input'); const list = document.querySelector('#astro-search-results');
  let searchData: { title: string; url: string; description: string }[] | undefined;
  document.querySelectorAll('.search-popup-trigger').forEach((button) => button.addEventListener('click', async () => {
    dialog?.showModal(); input?.focus();
    try { searchData ??= await fetch(`/${language}/search.json`, { signal }).then((response) => { if (!response.ok) throw new Error('Search unavailable'); return response.json(); }); }
    catch { if (list && !signal.aborted) list.textContent = language === 'zh-CN' ? '搜索加载失败，请重试。' : 'Search failed. Please retry.'; }
  }, { signal }));
  input?.addEventListener('input', () => {
    if (!list) return; list.replaceChildren(); const query = input.value.trim().toLocaleLowerCase(); if (!query) return;
    for (const item of (searchData || []).filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase().includes(query))) {
      const li = document.createElement('li'); const link = document.createElement('a'); link.href = item.url; link.textContent = item.title; li.append(link); list.append(li);
    }
  }, { signal });
  if (document.querySelector('.toolbox-workspace')) {
    const script = document.createElement('script'); script.src = `/${language}/js/toolbox.js`; document.body.append(script); signal.addEventListener('abort', () => script.remove(), { once: true });
  }
}
initPage();
if (globals.Swup && !location.pathname.includes('/resume/')) {
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const plugins = ['SwupProgressPlugin','SwupScrollPlugin','SwupPreloadPlugin'].filter((name) => globals[name]).map((name) => new globals[name](name === 'SwupScrollPlugin' ? { offset: 80 } : {}));
  if (!reduced && globals.SwupSlideTheme) plugins.push(new globals.SwupSlideTheme({ mainElement: '.main-content-body' }));
  const swup = new globals.Swup({ containers: ['#swup'], plugins, linkSelector: 'a[href]:not([href*="/resume/"]):not([lang])' }) as SwupInstance;
  swup.hooks.before('content:replace', () => { pageScope.abort(); document.documentElement.classList.remove('astro-menu-open'); }); swup.hooks.on('page:view', initPage);
}
