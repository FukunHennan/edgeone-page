/** Calm homepage gallery. One instance per page, torn down on Swup navigation. */
export function initCalmCarousel(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-calm-carousel]');
  if (!root) return;
  const slides = [...root.querySelectorAll<HTMLElement>('[data-calm-slide]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-calm-dot]')];
  const videos = slides.map((slide) => slide.querySelector<HTMLVideoElement>('[data-calm-video]'));
  const prev = root.querySelector<HTMLButtonElement>('[data-calm-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-calm-next]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-calm-pause]');
  const announcement = root.querySelector<HTMLElement>('[data-calm-announcement]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (slides.length < 2) return;

  const zh = document.documentElement.lang === 'zh-CN';
  let index = 0;
  let paused = reduceMotion.matches;
  let hover = false;
  let focusInside = false;
  let timer: number | undefined;
  let startTouch: { x: number; y: number } | undefined;

  function stop() {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
  }
  function canAutoplay() {
    return !signal.aborted && root?.isConnected && !paused && !reduceMotion.matches &&
      !hover && !focusInside && document.visibilityState === 'visible';
  }
  function schedule() {
    stop();
    if (canAutoplay()) timer = window.setTimeout(() => {
      show(index + 1, false);
      schedule();
    }, 8000);
  }
  // Only fetch and play the active film; photos stay visible if the video fails.
  function syncVideo() {
    videos.forEach((video, position) => {
      if (!video) return;
      const shouldPlay = position === index && !paused && !reduceMotion.matches &&
        document.visibilityState === 'visible' && !signal.aborted;
      if (!shouldPlay) { video.pause(); return; }
      if (!video.src && video.dataset.videoSrc) video.src = video.dataset.videoSrc;
      const playback = video.play();
      if (playback) void playback.catch(() => {
        slides[position]?.classList.remove('has-live-video');
      });
    });
  }
  videos.forEach((video, position) => {
    video?.addEventListener('playing', () => {
      if (position === index) slides[position]?.classList.add('has-live-video');
    }, { signal });
    video?.addEventListener('error', () => {
      slides[position]?.classList.remove('has-live-video');
    }, { signal });
  });
  function updatePauseButton() {
    if (!toggle) return;
    const off = paused || reduceMotion.matches;
    toggle.setAttribute('aria-pressed', String(off));
    toggle.setAttribute('aria-label', off ?
      (zh ? '播放轮播' : 'Play slideshow') :
      (zh ? '暂停轮播' : 'Pause slideshow'));
    toggle.textContent = off ? '▶' : 'Ⅱ';
    toggle.disabled = reduceMotion.matches;
  }
  function show(nextIndex: number, userAction: boolean) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const active = position === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, position) => {
      const active = position === index;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    syncVideo();
    if (userAction && announcement) {
      const label = dots[index]?.getAttribute('aria-label') || '';
      announcement.textContent = label;
    }
  }

  prev?.addEventListener('click', () => { show(index - 1, true); schedule(); }, { signal });
  next?.addEventListener('click', () => { show(index + 1, true); schedule(); }, { signal });
  dots.forEach((dot, position) => dot.addEventListener('click', () => {
    show(position, true);
    schedule();
  }, { signal }));
  toggle?.addEventListener('click', () => {
    // In reduced-motion mode a visitor may navigate manually, but autoplay stays off.
    paused = !paused;
    updatePauseButton();
    syncVideo();
    schedule();
  }, { signal });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1, true); schedule(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1, true); schedule(); }
  }, { signal });
  root.addEventListener('pointerenter', () => { hover = true; stop(); }, { signal });
  root.addEventListener('pointerleave', () => { hover = false; schedule(); }, { signal });
  root.addEventListener('focusin', () => { focusInside = true; stop(); }, { signal });
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget as Node | null)) { focusInside = false; schedule(); }
  }, { signal });
  root.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    if (touch) startTouch = { x: touch.clientX, y: touch.clientY };
  }, { passive: true, signal });
  root.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    if (!touch || !startTouch) return;
    const dx = touch.clientX - startTouch.x;
    const dy = touch.clientY - startTouch.y;
    startTouch = undefined;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      show(index + (dx < 0 ? 1 : -1), true);
      schedule();
    }
  }, { passive: true, signal });
  document.addEventListener('visibilitychange', () => { syncVideo(); schedule(); }, { signal });
  reduceMotion.addEventListener('change', () => { updatePauseButton(); syncVideo(); schedule(); }, { signal });
  signal.addEventListener('abort', () => { stop(); videos.forEach((video) => video?.pause()); }, { once: true });
  updatePauseButton();
  syncVideo();
  schedule();
}
