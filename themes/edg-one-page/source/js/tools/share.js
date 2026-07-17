(() => {
  if (window.__edgeoneArticleShareInitialized) return;
  window.__edgeoneArticleShareInitialized = true;

  const setStatus = (container, message, isError = false) => {
    const status = container.querySelector(".article-share-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
    window.setTimeout(() => {
      if (status.textContent === message) status.textContent = "";
    }, 2600);
  };

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Copy command failed");
  };

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-share-action]");
    if (!button) return;
    const container = button.closest(".article-share");
    if (!container) return;

    const title = container.dataset.shareTitle || document.title;
    const url = window.location.href;
    const action = button.dataset.shareAction;
    const copiedMessage = container.dataset.copied || "Link copied";
    const failedMessage = container.dataset.failed || "Unable to share";

    try {
      if (action === "native") {
        if (navigator.share) await navigator.share({ title, url });
        else {
          await copyText(url);
          setStatus(container, copiedMessage);
        }
      } else if (action === "copy") {
        await copyText(url);
        setStatus(container, copiedMessage);
      } else if (action === "email") {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("[edgeone-page] Share action failed:", error);
        setStatus(container, failedMessage, true);
      }
    }
  });
})();
