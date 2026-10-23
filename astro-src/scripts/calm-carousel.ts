/** Full-bleed photo slideshow — no video playback or video downloads. */
export function initCalmCarousel(signal: AbortSignal) {
  const root = document.querySelector<HTMLElement>('[data-calm-carousel]');
  if (!root) return;
  const slides = [...root.querySelectorAll<HTMLElement>('[data-calm-slide]')];
  if (slides.length < 2) return;

  const photos = slides.map(slide => slide.querySelector<HTMLImageElement>('.calm-poster'));
  const immersiveButton = root.querySelector<HTMLButtonElement>('[data-calm-immersive]');
  const announcement = root.querySelector<HTMLElement>('[data-calm-announcement]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const zh = document.documentElement.lang === 'zh-CN';
  const HOLD_MS = 14000;
  let index = 0;
  let focused = false;
  let immersive = false;
  let timer: number | undefined;
  let startTouch: {x: number; y: number} | undefined;

  const stop = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const canAdvance = () => !signal.aborted && root.isConnected &&
    !reduceMotion.matches && !focused && document.visibilityState === 'visible';

  const updateControls = () => {
    if (immersiveButton) {
      immersiveButton.setAttribute('aria-pressed', String(immersive));
      const label = immersive ?
        (zh ? '退出沉浸模式' : 'Exit immersive mode') :
        (zh ? '进入沉浸模式' : 'Enter immersive mode');
      immersiveButton.setAttribute('aria-label', label);
      immersiveButton.textContent = label;
    }
  };

  const show = (next: number, userAction = false) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const active = position === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    if (userAction && announcement) announcement.textContent = photos[index]?.alt || '';
  };
  const schedule = () => {
    stop();
    if (canAdvance()) timer = window.setTimeout(() => {
      show(index + 1);
      schedule();
    }, HOLD_MS);
  };
  const move = (offset: number) => { show(index + offset, true); schedule(); };

  photos.forEach((photo) => photo?.addEventListener('error', () => {
    // A failed image uses the smooth gradient already painted by CSS; no old assets.
    if (photo) photo.style.opacity = '0';
  }, { signal }));

  const setImmersive = (next: boolean) => {
    immersive = next;
    root.classList.toggle('is-immersive', next);
    document.documentElement.classList.toggle('calm-immersive', next);
    updateControls();
  };
  immersiveButton?.addEventListener('click', () => setImmersive(!immersive), { signal });
  root.addEventListener('dblclick', (event) => {
    if (!(event.target as HTMLElement).closest('button,a,select,input')) {
      setImmersive(!immersive);
    }
  }, { signal });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  }, { signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && immersive) {
      setImmersive(false);
      immersiveButton?.focus();
    }
  }, { signal });

  root.addEventListener('focusin', (event) => {
    if ((event.target as HTMLElement).matches(':focus-visible')) {
      focused = true;
      stop();
    }
  }, { signal });
  root.addEventListener('pointerdown', () => { focused = false; schedule(); }, { signal });
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget as Node | null)) {
      focused = false;
      schedule();
    }
  }, { signal });
  root.addEventListener('touchstart', event => {
    const touch = event.changedTouches[0];
    if (touch) startTouch = { x: touch.clientX, y: touch.clientY };
  }, { signal, passive: true });
  root.addEventListener('touchend', event => {
    const touch = event.changedTouches[0];
    if (!touch || !startTouch) return;
    const dx = touch.clientX - startTouch.x;
    const dy = touch.clientY - startTouch.y;
    startTouch = undefined;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
  }, { signal, passive: true });

  document.addEventListener('visibilitychange', schedule, { signal });
  reduceMotion.addEventListener('change', () => {
    updateControls();
    schedule();
  }, { signal });
  signal.addEventListener('abort', () => {
    stop();
    document.documentElement.classList.remove('calm-immersive');
  }, { once: true });
  updateControls();
  schedule();
}
