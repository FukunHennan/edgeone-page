/**
 * 站内“返回上一页”控件。
 *
 * 站点通过 Swup 做单页过渡，浏览器后退键一直可用，但页面上没有任何可见的返回入口。
 * 这里用一个会话栈记录本标签页访问过的站内路径：栈里还有上一条时按钮显示
 * “返回上一页”并调用 history.back()，否则退回首页链接，避免出现点了没反应的按钮。
 */
const STACK_KEY = "personal-hub:nav-stack";
const MAX_ENTRIES = 60;

const currentEntry = () => `${location.pathname}${location.search}`;

const storageAvailable = () => {
  try {
    sessionStorage.setItem(`${STACK_KEY}:probe`, "1");
    sessionStorage.removeItem(`${STACK_KEY}:probe`);
    return true;
  } catch (_) {
    return false;
  }
};

const readStack = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STACK_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((entry) => typeof entry === "string")
      : [];
  } catch (_) {
    return [];
  }
};

const writeStack = (stack) => {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX_ENTRIES)));
  } catch (_) {
    // 隐私模式下写入会失败，此时退回 referrer 判断。
  }
};

/** 记录当前页并返回“栈里是否还有上一条”。 */
const pushEntry = (entry) => {
  const stack = readStack();
  const seen = stack.lastIndexOf(entry);
  const next = seen === -1 ? stack : stack.slice(0, seen + 1);

  if (next[next.length - 1] !== entry) {
    next.push(entry);
  }

  writeStack(next);
  return next.length > 1;
};

const inferFromReferrer = (entry) => {
  if (history.length <= 1) {
    return false;
  }

  try {
    const referrer = new URL(document.referrer);
    return (
      referrer.origin === location.origin &&
      `${referrer.pathname}${referrer.search}` !== entry
    );
  } catch (_) {
    return false;
  }
};

export default function initBackToPrevious() {
  const link = document.querySelector("[data-history-back]");

  if (!link || link.dataset.backBound === "true") {
    return;
  }

  link.dataset.backBound = "true";

  const label = link.querySelector("[data-history-back-label]");
  const isZh = (document.documentElement.lang || "").toLowerCase().startsWith("zh");
  const entry = currentEntry();
  const canGoBack = storageAvailable() ? pushEntry(entry) : inferFromReferrer(entry);

  if (label) {
    label.textContent = canGoBack
      ? isZh
        ? "返回上一页"
        : "Go back"
      : isZh
        ? "返回首页"
        : "Back to home";
  }

  link.addEventListener("click", (event) => {
    if (!canGoBack) {
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    history.back();
  });
}
