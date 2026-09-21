const bindFilter = ({ root, buttonSelector, itemSelector, countSelector, filterData, suffix, searchable = false }) => {
  if (!root || root.dataset.workspaceBound === "true") return;
  root.dataset.workspaceBound = "true";
  const count = root.querySelector(countSelector);
  const input = searchable ? root.querySelector(".workspace-search input") : null;
  let filter = "all";
  const render = () => {
    const items = [...root.querySelectorAll(itemSelector)];
    const buttons = [...root.querySelectorAll(buttonSelector)];
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
      button.classList.toggle("active", (button.dataset[filterData] || "all") === filter);
    });
    if (count) count.textContent = `${visible} ${suffix}`;
  };
  root.addEventListener("click", (event) => {
    const button = event.target.closest(buttonSelector);
    if (!button) return;
    filter = button.dataset[filterData] || "all";
    render();
  });
  input?.addEventListener("input", render);
  render();
};

export default function initPersonalHubWorkspaces() {
  const notes = document.querySelector(".notes-workspace");
  if (notes) bindFilter({ root: notes, buttonSelector: "[data-note-filter]", itemSelector: ".note-list article", countSelector: "#note-count", filterData: "noteFilter", suffix: document.documentElement.lang?.startsWith("zh") ? "个主题" : "topics", searchable: true });
  const projects = document.querySelector(".projects-workspace");
  if (projects) bindFilter({ root: projects, buttonSelector: "[data-project-filter]", itemSelector: ".project-workspace-grid article", countSelector: "#project-count", filterData: "projectFilter", suffix: document.documentElement.lang?.startsWith("zh") ? "个项目" : "projects" });
}
