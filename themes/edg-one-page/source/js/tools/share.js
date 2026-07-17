const setStatus = (container, message, error = false) => {
  const status = container.querySelector('.article-share-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', error);
};

const copyLink = async (url) => {
  await navigator.clipboard.writeText(url);
};

const initArticleShare = ({ signal } = {}) => {
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-share-action]');
    if (!button) return;
    const container = button.closest('.article-share');
    if (!container) return;
    const url = location.href;
    const title = container.dataset.shareTitle || document.title;
    try {
      if (button.dataset.shareAction === 'native' && navigator.share) {
        await navigator.share({ title, url });
      } else if (button.dataset.shareAction === 'copy' || !navigator.share) {
        await copyLink(url);
        setStatus(container, container.dataset.copied || 'Link copied');
      } else if (button.dataset.shareAction === 'email') {
        location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
      }
    }