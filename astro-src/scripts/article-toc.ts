const TOC_OFFSET = 110; // 章节线；须 ≥ CSS scroll-margin-top / SwupScrollPlugin offset (96)，保证点击定位后该条目恰好点亮

type Entry = { link: HTMLAnchorElement; section: HTMLElement };

/**
 * 文章目录滚动高亮。
 * 语义是「顶部章节线」：取最后一个 top <= TOC_OFFSET 的标题为当前章节，
 * 未到第一节时高亮第一节。随 Swup 换页由 theme-runtime 的 pageScope signal 统一销毁重建。
 */
export function initArticleToc(signal: AbortSignal) {
  const toc = document.querySelector('.astro-toc');
  if (!toc) return;
  const links = [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const entries = links
    .map((link) => ({ link, section: document.getElementById(decodeURIComponent(link.hash.slice(1))) }))
    .filter((entry): entry is Entry => Boolean(entry.section));
  if (!entries.length) return;

  let frame = 0;
  const apply = () => {
    frame = 0;
    let current = entries[0];
    for (const entry of entries) {
      if (entry.section.getBoundingClientRect().top - TOC_OFFSET <= 0) current = entry;
    }
    // 末尾几节永远翻不过章节线（文章末尾到文档底不够长），滚到底时强制点亮最后一项，
    // 否则右栏会停在倒数几项上。
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0 && window.scrollY >= maxScroll - 4) current = entries[entries.length - 1];
    for (const entry of entries) {
      const active = entry === current;
      entry.link.classList.toggle('is-active', active);
      if (active) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(apply);
  };
  window.addEventListener('scroll', schedule, { passive: true, signal });
  window.addEventListener('resize', schedule, { passive: true, signal });
  signal.addEventListener('abort', () => {
    if (frame) cancelAnimationFrame(frame);
  }, { once: true });
  apply();
}
