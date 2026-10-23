const bindFilter = ({ root, buttonSelector, itemSelector, countSelector, filterData, suffix, searchable = false, signal }) => {
  if (!root || root.dataset.workspaceBound === "true") return;
  root.dataset.workspaceBound = "true";
  signal?.addEventListener("abort", () => { delete root.dataset.workspaceBound; }, { once: true });
  const count = root.querySelector(countSelector);
  const input = searchable ? root.querySelector(".workspace-search input") : null;
  const items = [...root.querySelectorAll(itemSelector)];
  const buttons = [...root.querySelectorAll(buttonSelector)];
  const heading = root.querySelector('[data-filter-heading]');
  const empty = document.createElement('p');
  empty.className = 'workspace-empty';
  empty.hidden = true;
  empty.textContent = document.documentElement.lang?.startsWith('zh') ? '没有匹配的内容，请调整筛选或搜索词。' : 'No matching results. Try another filter or search.';
  root.querySelector('.workspace-content')?.append(empty);
  signal?.addEventListener('abort', () => empty.remove(), { once: true });
  buttons.forEach((button) => {
    const kind = button.dataset[filterData] || 'all';
    const badge = button.querySelector('span');
    if (badge) badge.textContent = String(items.filter((item) => kind === 'all' || (item.dataset.kind || '').split(' ').includes(kind)).length);
  });
  let filter = "all";
  const render = () => {
    const query = (input?.value || "").trim().toLowerCase();
    let visible = 0;
    items.forEach((item) => {
      const kinds = (item.dataset.kind || "").split(" ");
      const haystack = `${item.dataset.search || ""} ${item.innerText || ""}`.toLowerCase();
      const show = (filter === "all" || kinds.includes(filter)) && (!query || haystack.includes(query));
      item.hidden = !show;
      if (show) visible += 1;
    });
    buttons.forEach((button) => {
      const active = (button.dataset[filterData] || "all") === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      if (active && heading) heading.textContent = [...button.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('').trim();
    });
    if (count) count.textContent = `${visible} ${suffix}`;
    count?.setAttribute('aria-live', 'polite');
    empty.hidden = visible !== 0;
  };
  root.addEventListener("click", (event) => {
    const button = event.target.closest(buttonSelector);
    if (!button) return;
    filter = button.dataset[filterData] || "all";
    render();
    if (root.classList.contains('projects-workspace')) {
      const content = root.querySelector('.workspace-content');
      if (content) content.scrollTop = 0;
    }
  }, { signal });
  input?.addEventListener("input", render, { signal });
  render();
};

export default function initPersonalHubWorkspaces({ signal } = {}) {
  const notes = document.querySelector(".notes-workspace");
  if (notes) bindFilter({ root: notes, buttonSelector: "[data-note-filter]", itemSelector: ".note-list article", countSelector: "#note-count", filterData: "noteFilter", suffix: document.documentElement.lang?.startsWith("zh") ? "个主题" : "topics", searchable: true, signal });
  const projects = document.querySelector(".projects-workspace");
  if (projects) bindFilter({ root: projects, buttonSelector: "[data-project-filter]", itemSelector: ".project-workspace-grid article", countSelector: "#project-count", filterData: "projectFilter", suffix: document.documentElement.lang?.startsWith("zh") ? "个项目" : "projects", signal });
}
