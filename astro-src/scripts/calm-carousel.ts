/** Quiet homepage: accessible, data-conscious, and cleaned up across Swup page changes. */
export function initCalmCarousel(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-calm-carousel]');
  if (!root) return;
  const slides = [...root.querySelectorAll<HTMLElement>('[data-calm-slide]')];
  if (slides.length < 2) return;

  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-calm-dot]')];
  const videos = slides.map((slide) => slide.querySelector<HTMLVideoElement>('[data-calm-video]'));
  const posters = slides.map((slide) => slide.querySelector<HTMLImageElement>('.calm-poster'));
  const prev = root.querySelector<HTMLButtonElement>('[data-calm-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-calm-next]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-calm-pause]');
  const immersiveButton = root.querySelector<HTMLButtonElement>('[data-calm-immersive]');
  const announcement = root.querySelector<HTMLElement>('[data-calm-announcement]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: {
    saveData?: boolean;
    effectiveType?: string;
    addEventListener?: (event: string, cb: () => void, options?: AddEventListenerOptions) => void;
  } }).connection;
  const zh = document.documentElement.lang === 'zh-CN';

  let index = 0;
  let paused = reduceMotion.matches;
  let focusInside = false;
  let timer: number | undefined;
  let immersive = false;
  let startTouch: { x: number; y: number } | undefined;
  const failedVideos = new Set<number>();
  const VIDEO_HOLD_MS = 14000;

  const stop = () => {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
  };
  const conservativeNetwork = () => Boolean(connection?.saveData ||
    /^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? ''));
  const canAutoAdvance = () => !signal.aborted && root.isConnected &&
    !paused && !reduceMotion.matches && !focusInside &&
    document.visibilityState === 'visible';

  const updateControls = () => {
    if (toggle) {
      const off = paused || reduceMotion.matches;
      toggle.setAttribute('aria-pressed', String(off));
      toggle.setAttribute('aria-label', off ?
        (zh ? '播放轮播' : 'Play slideshow') :
        (zh ? '暂停轮播' : 'Pause slideshow'));
      toggle.textContent = off ? '▶' : 'Ⅱ';
      toggle.disabled = reduceMotion.matches;
    }
    if (immersiveButton) {
      immersiveButton.setAttribute('aria-pressed', String(immersive));
      immersiveButton.setAttribute('aria-label', immersive ?
        (zh ? '退出沉浸模式' : 'Exit immersive mode') :
        (zh ? '进入沉浸模式' : 'Enter immersive mode'));
      immersiveButton.textContent = immersive ? '↙' : '⛶';
      immersiveButton.title = immersiveButton.getAttribute('aria-label') || '';
    }
  };

  const syncVideo = () => {
    videos.forEach((video, position) => {
      if (!video) return;
      const shouldPlay = position === index && !paused && !reduceMotion.matches &&
        !conservativeNetwork() && !failedVideos.has(position) &&
        document.visibilityState === 'visible' && !signal.aborted;
      if (!shouldPlay) { video.pause(); return; }
      if (!video.src && video.dataset.videoSrc) video.src = video.dataset.videoSrc;
      if (video.paused) {
        const playback = video.play();
        if (playback) void playback.catch(() => {
          slides[position]?.classList.remove('has-live-video');
          // Autoplay can be blocked by the browser; keep the photo visible.
        });
      }
    });
  };

  const show = (nextIndex: number, userAction: boolean) => {
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
      announcement.textContent = dots[index]?.getAttribute('aria-label') || '';
    }
  };

  const schedule = () => {
    stop();
    if (canAutoAdvance()) timer = window.setTimeout(() => {
      show(index + 1, false);
      schedule();
    }, VIDEO_HOLD_MS);
  };

  videos.forEach((video, position) => {
    video?.addEventListener('playing', () => {
      if (position === index && !paused && !reduceMotion.matches && !conservativeNetwork()) {
        slides[position]?.classList.add('has-live-video');
      }
    }, { signal });
    video?.addEventListener('error', () => {
      failedVideos.add(position);
      slides[position]?.classList.remove('has-live-video');
      video.pause();
    }, { signal });
  });
  posters.forEach((poster) => poster?.addEventListener('error', () => {
    const fallback = poster.dataset.fallbackSrc;
    if (fallback && !poster.src.endsWith(fallback)) {
      poster.src = fallback; // Bundled SVG is always available even when remote images fail.
    }
  }, { signal }));

  const move = (offset: number) => { show(index + offset, true); schedule(); };
  prev?.addEventListener('click', () => move(-1), { signal });
  next?.addEventListener('click', () => move(1), { signal });
  dots.forEach((dot, position) => dot.addEventListener('click', () => {
    show(position, true);
    schedule();
  }, { signal }));
  toggle?.addEventListener('click', () => {
    paused = !paused;
    updateControls();
    syncVideo();
    schedule();
  }, { signal });

  const setImmersive = (enabled: boolean) => {
    immersive = enabled;
    root.classList.toggle('is-immersive', enabled);
    document.documentElement.classList.toggle('calm-immersive', enabled);
    updateControls();
    // When exiting immersive mode the original keyboard focus remains available.
  };
  immersiveButton?.addEventListener('click', () => setImmersive(!immersive), { signal });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  }, { signal });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && immersive) {
      setImmersive(false);
      immersiveButton?.focus();
    }
  }, { signal });

  // Do not pause on pointer hover: the gallery fills most desktop viewports.
  // Pause automatic slide changes only while a keyboard user is interacting.
  root.addEventListener('focusin', () => { focusInside = true; stop(); }, { signal });
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget as Node | null)) {
      focusInside = false;
      schedule();
    }
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
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
  }, { passive: true, signal });

  document.addEventListener('visibilitychange', () => { syncVideo(); schedule(); }, { signal });
  window.addEventListener('online', syncVideo, { signal });
  window.addEventListener('offline', syncVideo, { signal });
  reduceMotion.addEventListener('change', () => { updateControls(); syncVideo(); schedule(); }, { signal });
  connection?.addEventListener?.('change', () => { syncVideo(); schedule(); }, { signal });
  signal.addEventListener('abort', () => {
    stop();
    videos.forEach((video) => video?.pause());
    document.documentElement.classList.remove('calm-immersive');
  }, { once: true });

  updateControls();
  syncVideo();
  schedule();
}
