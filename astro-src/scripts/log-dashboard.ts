/**
 * Owner-only dashboard renderer for the site assistant's maintenance log.
 *
 * The token is held ONLY in this page's sessionStorage (never persisted to a
 * file, Git, or localStorage) and sent as the `x-log-token` header to
 * /agent-log. No analytics, no upload — everything stays in the browser.
 */

type LogEntry = {
  role: 'question' | 'answer';
  lang: string | null;
  at: string | null;
  sid: string | null;
  text: string;
};

type LogThread = {
  sid: string;
  startedAt: string | null;
  turns: number;
  entries: LogEntry[];
};

type LogResponse = {
  count?: number;
  raw?: number;
  sessions?: number;
  threads?: LogThread[];
  entries?: LogEntry[];
  error?: string;
  detail?: string;
};

const STORAGE_KEY = 'site-agent-log-token';

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function renderDashboard(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>('[data-token-form]');
  const input = root.querySelector<HTMLInputElement>('[data-token-input]');
  const loadBtn = root.querySelector<HTMLButtonElement>('[data-load-btn]');
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-clear-btn]');
  const statusEl = root.querySelector<HTMLElement>('[data-status]');
  const overview = root.querySelector<HTMLElement>('[data-overview]');
  const threadsEl = root.querySelector<HTMLElement>('[data-threads]');
  if (!form || !input || !loadBtn || !clearBtn || !statusEl || !overview || !threadsEl) return;

  const lang = root.dataset.lang || 'zh-CN';
  const t = {
    loading: lang === 'zh-CN' ? '正在加载…' : 'Loading…',
    unauthorized: lang === 'zh-CN' ? '令牌无效或未配置' : 'Invalid or missing token',
    error: lang === 'zh-CN' ? '加载失败' : 'Load failed',
    empty: lang === 'zh-CN' ? '暂无记录' : 'No records yet',
    unknownSession: lang === 'zh-CN' ? '未知会话（旧日志，无匿名 ID）' : 'Unknown session (legacy log, no anonymous id)',
    turnsLabel: lang === 'zh-CN' ? '轮' : 'turns',
    question: lang === 'zh-CN' ? '访客' : 'Visitor',
    answer: lang === 'zh-CN' ? '助手' : 'Assistant',
  };

  const setStatus = (msg: string, isError = false) => {
    statusEl.textContent = msg;
    statusEl.classList.toggle('is-error', isError);
  };

  // Restore a previously entered token for this session.
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    input.value = saved;
    clearBtn.hidden = false;
  }

  const render = (data: LogResponse) => {
    const threads = data.threads || [];
    const entries = data.entries || [];

    const sessions = typeof data.sessions === 'number' ? data.sessions : threads.length;
    const questions = entries.filter((e) => e.role === 'question').length;
    const answers = entries.filter((e) => e.role === 'answer').length;

    overview.hidden = false;
    overview.querySelector<HTMLElement>('[data-stat-sessions]')!.textContent = String(sessions);
    overview.querySelector<HTMLElement>('[data-stat-turns]')!.textContent = String(questions);
    overview.querySelector<HTMLElement>('[data-stat-questions]')!.textContent = String(questions);
    overview.querySelector<HTMLElement>('[data-stat-answers]')!.textContent = String(answers);

    threadsEl.innerHTML = '';
    if (threads.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'logd-empty';
      empty.textContent = t.empty;
      threadsEl.appendChild(empty);
      return;
    }

    for (const thread of threads) {
      const card = document.createElement('article');
      card.className = 'logd-thread';

      const head = document.createElement('header');
      head.className = 'logd-thread-head';
      const id = document.createElement('span');
      id.className = 'logd-thread-id';
      id.textContent = thread.sid === 'unknown' ? t.unknownSession : `#${thread.sid}`;
      const meta = document.createElement('span');
      meta.className = 'logd-thread-meta';
      meta.innerHTML = '';
      const start = document.createElement('span');
      start.textContent = fmtTime(thread.startedAt);
      const turns = document.createElement('span');
      const b = document.createElement('b');
      b.textContent = String(thread.turns);
      turns.appendChild(b);
      turns.appendChild(document.createTextNode(` ${t.turnsLabel}`));
      meta.appendChild(start);
      meta.appendChild(turns);
      head.appendChild(id);
      head.appendChild(meta);
      card.appendChild(head);

      for (const entry of thread.entries) {
        const turn = document.createElement('div');
        turn.className = `logd-turn ${entry.role === 'question' ? 'is-q' : 'is-a'}`;
        const role = document.createElement('span');
        role.className = 'logd-role';
        role.textContent = entry.role === 'question' ? t.question : t.answer;
        const text = document.createElement('div');
        text.className = 'logd-text';
        text.textContent = entry.text;
        turn.appendChild(role);
        turn.appendChild(text);
        card.appendChild(turn);
      }

      threadsEl.appendChild(card);
    }
  };

  const load = async () => {
    const token = input.value.trim();
    if (!token) {
      setStatus(t.unauthorized, true);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, token);
    clearBtn.hidden = false;
    loadBtn.disabled = true;
    setStatus(t.loading);
    try {
      const res = await fetch('/agent-log', { headers: { 'x-log-token': token } });
      const data = (await res.json()) as LogResponse;
      if (!res.ok || data.error) {
        setStatus(data.error === 'Unauthorized' ? t.unauthorized : (data.detail || data.error || t.error), true);
        return;
      }
      setStatus('');
      render(data);
    } catch {
      setStatus(t.error, true);
    } finally {
      loadBtn.disabled = false;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void load();
  });

  clearBtn.addEventListener('click', () => {
    sessionStorage.removeItem(STORAGE_KEY);
    input.value = '';
    clearBtn.hidden = true;
    overview.hidden = true;
    threadsEl.innerHTML = '';
    setStatus('');
  });

  // Auto-load if a token was already provided this session.
  if (saved) void load();
}
