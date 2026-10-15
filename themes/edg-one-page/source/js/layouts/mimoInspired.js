export default function initMimoInspired({ signal } = {}) {
  const hero = document.querySelector(".mimo-home-art");
  const revealTargets = document.querySelectorAll(
    ".hub-dashboard .hub-section-head, .hub-dashboard .hub-quick-card, .hub-dashboard-grid > section",
  );
  if (!hero && !revealTargets.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  if (hero && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    hero.addEventListener("pointermove", (event) => {
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      hero.style.setProperty("--pointer-x", `${(x * 24).toFixed(1)}px`);
      hero.style.setProperty("--pointer-y", `${(y * 24).toFixed(1)}px`);
    }, { signal });
    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--pointer-x", "0px");
      hero.style.setProperty("--pointer-y", "0px");
    }, { signal });
  }

  if (!revealTargets.length || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px 40px 0px" });

  revealTargets.forEach((target, index) => {
    target.classList.add("mimo-reveal");
    if (target.classList.contains("hub-quick-card")) {
      target.style.setProperty("--reveal-delay", `${(index % 6) * 55}ms`);
    }
    observer.observe(target);
  });
  signal?.addEventListener("abort", () => observer.disconnect(), { once: true });
}
