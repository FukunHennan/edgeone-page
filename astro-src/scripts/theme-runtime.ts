import initMimoInspired from '../../themes/edg-one-page/source/js/layouts/mimoInspired.js';
import initWorkspaces from '../../themes/edg-one-page/source/js/layouts/personalHubWorkspaces.js';
import { initArticleToc } from './article-toc';
import { initCalmCarousel } from './calm-carousel';
type SwupInstance = { hooks: { on: (event: string, callback: () => void) => void; before: (event: string, callback: () => void) => void } };
const globals = window as unknown as Record<string, new (options?: Record<string, unknown>) => unknown>;
function initArchiveSearch(signal: AbortSignal) {
  const input = document.querySelector<HTMLInputElement>('[data-archive-search]');
  if (!input) return;
  const rows = [...document.querySelectorAll<HTMLElement>('.scenic-archive .scenic-story')];
  const filters = [...document.querySelectorAll<HTMLButtonElement>('[data-archive-filter]')];
  const tagSelect = document.querySelector<HTMLSelectElement>('[data-archive-tag]');
  const clear = document.querySelector<HTMLButtonElement>('[data-archive-clear]');
  const count = document.querySelector<HTMLElement>('[data-archive-count]');
  const empty = document.querySelector<HTMLElement>('[data-archive-empty]');
  const zh = document.documentElement.lang === 'zh-CN';
  const indexedRows = rows.map((row) => ({
    row,
    categories: JSON.parse(row.dataset.articleCategories || '[]') as string[],
    tags: JSON.parse(row.dataset.articleTags || '[]') as string[],
  }));
  let category = '';
  let tag = '';
  const readUrl = () => {
    const params = new URLSearchParams(location.search);
    category = params.get('category') || '';
    tag = params.get('tag') || '';
    input.value = params.get('q') || '';
    if (tagSelect) tagSelect.value = tag;
  };
  const writeUrl = (mode: 'push' | 'replace') => {
    const url = new URL(location.href);
    for (const [key, value] of [['category', category], ['tag', tag], ['q', input.value.trim()]]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history[mode === 'push' ? 'pushState' : 'replaceState'](history.state, '', url);
  };
  const apply = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    indexedRows.forEach(({ row, categories, tags }) => {
      const matches = (!category || categories.includes(category)) &&
        (!tag || tags.includes(tag)) && (!query || (row.dataset.articleSearch || '').includes(query));
      row.hidden = !matches;
      if (matches) visible++;
    });
    if (count) count.textContent = zh ? `${visible} 篇文章` : `${visible} articles`;
    if (empty) empty.hidden = visible !== 0;
    filters.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filterValue === category)));
    if (tagSelect) tagSelect.value = tag;
    if (clear) clear.hidden = !category && !tag && !query;
  };
  filters.forEach((button) => button.addEventListener('click', () => {
    category = button.dataset.filterValue || '';
    writeUrl('push');
    apply();
  }, { signal }));
  tagSelect?.addEventListener('change', () => {
    tag = tagSelect.value;
    writeUrl('push');
    apply();
  }, { signal });
  clear?.addEventListener('click', () => {
    category = '';
    tag = '';
    input.value = '';
    writeUrl('push');
    apply();
  }, { signal });
  document.querySelector('.scenic-archive')?.addEventListener('click', (event) => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[data-archive-kind]');
    if (!anchor || event.defaultPrevented || (event as MouseEvent).button !== 0 ||
      (event as MouseEvent).metaKey || (event as MouseEvent).ctrlKey ||
      (event as MouseEvent).shiftKey || (event as MouseEvent).altKey) return;
    event.preventDefault();
    if (anchor.dataset.archiveKind === 'category') category = anchor.dataset.archiveValue || '';
    else tag = anchor.dataset.archiveValue || '';
    writeUrl('push');
    apply();
  }, { signal });
  input.addEventListener('input', () => { writeUrl('replace'); apply(); }, { signal });
  window.addEventListener('popstate', () => { readUrl(); apply(); }, { signal });
  readUrl();
  apply();
}
// Site-wide navbar reveal: on pointer-fine devices the navbar stays hidden until
// the cursor approaches the top edge (or keyboard focus enters it). No overlay is
// used, so scrolled page content never gets blocked.
function initNavbarReveal() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  const top = 80;
  let shown = false;
  const setShown = (next: boolean) => {
    if (shown === next) return;
    shown = next;
    root.classList.toggle('nav-reveal', next);
  };
  document.addEventListener('mousemove', (event) => setShown(event.clientY <= top), { passive: true });
  root.addEventListener('mouseleave', () => setShown(false));
  window.addEventListener('blur', () => setShown(false));
}
let pageScope = new AbortController();
function initPage() {
  pageScope.abort(); pageScope = new AbortController(); const signal = pageScope.signal;
  initMimoInspired({ signal }); initWorkspaces({ signal }); initArticleToc(signal); initCalmCarousel(signal); initArchiveSearch(signal);
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
  document.querySelectorAll<HTMLAnchorElement>('.hub-language-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const target = new URL(link.href);
      target.search = location.search;
      target.hash = location.hash;
      location.assign(target.href);
    }, { signal });
  });

}
initPage();
initNavbarReveal();
if (globals.Swup && !location.pathname.includes('/resume/')) {
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const plugins = ['SwupProgressPlugin','SwupScrollPlugin','SwupPreloadPlugin'].filter((name) => globals[name]).map((name) => new globals[name](name === 'SwupScrollPlugin' ? { offset: 96 } : {}));
  if (!reduced && globals.SwupSlideTheme) plugins.push(new globals.SwupSlideTheme({ mainElement: '.main-content-body' }));
  const swup = new globals.Swup({ containers: ['#swup'], plugins, linkSelector: 'a[href]:not([href*="/resume/"]):not([lang])' }) as SwupInstance;
  swup.hooks.before('content:replace', () => { pageScope.abort(); document.documentElement.classList.remove('astro-menu-open'); }); swup.hooks.on('page:view', initPage);
}
