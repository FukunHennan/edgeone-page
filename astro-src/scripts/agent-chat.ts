type ChatRole = 'assistant' | 'user';
type HistoryItem = { role: ChatRole; content: string };
type Frame = { event: string; data: Record<string, unknown> };
const keyFor = (lang: string) => `daotianshu-agent-cid-${lang}`;

function newConversationId(): string {
  return 'c_' + crypto.randomUUID().replace(/-/g, '');
}

function getConversationId(lang: string): string {
  let value = '';
  try { value = localStorage.getItem(keyFor(lang)) || ''; } catch { /* private browser mode */ }
  if (!/^c_[a-f0-9]{32}$/.test(value)) {
    value = newConversationId();
    try { localStorage.setItem(keyFor(lang), value); } catch { /* optional */ }
  }
  return value;
}

function toFrames(chunk: string): Frame | null {
  let event = '';
  const dataLines: string[] = [];
  for (const line of chunk.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  try {
    return event ? { event, data: JSON.parse(dataLines.join('\n')) as Record<string, unknown> } : null;
  } catch { return null; }
}

// Lightweight, dependency-free Markdown renderer for the assistant output.
// It builds DOM nodes directly and never sets innerHTML, so model output can
// never inject markup. Only a conservative subset is supported (headings,
// bold, italic, inline code, fenced code blocks, ordered/unordered lists,
// tables, blockquotes, hr, links). Anything else is escaped as text.

// Inline grammar: **bold**, *italic*, `code`, [text](url). Runs left to right,
// preferring bold over italic so nested/overlapping markers resolve sensibly.
function renderInline(parent: Node, text: string) {
  const tokenRe = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]*\]\([^)\s]+\))/g;
  let last = 0;
  for (const m of text.matchAll(tokenRe)) {
    const at = m.index ?? 0;
    if (at > last) parent.appendChild(document.createTextNode(text.slice(last, at)));
    const tok = m[0];
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
      const b = document.createElement('strong');
      b.textContent = tok.slice(2, -2);
      parent.appendChild(b);
    } else if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
      const c = document.createElement('code');
      c.textContent = tok.slice(1, -1);
      parent.appendChild(c);
    } else if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
      const i = document.createElement('em');
      i.textContent = tok.slice(1, -1);
      parent.appendChild(i);
    } else {
      const lm = tok.match(/^\[([^\]]*)\]\(([^)\s]+)\)$/);
      if (lm) {
        const href = lm[2];
        if (/^(https?:\/\/|\/|#)/i.test(href)) {
          const a = document.createElement('a');
          a.textContent = lm[1];
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          parent.appendChild(a);
        } else {
          // Non-web scheme (javascript:, data:, etc.) → render as inert text.
          parent.appendChild(document.createTextNode(lm[1]));
        }
      } else {
        parent.appendChild(document.createTextNode(tok));
      }
    }
    last = at + tok.length;
  }
  if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
}

function renderText(container: HTMLElement, text: string) {
  container.replaceChildren();
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  let listEl: HTMLUListElement | HTMLOListElement | null = null;
  let listOrdered = false;
  let inCode = false;
  let codeBuf: string[] = [];

  const closeList = () => { listEl = null; };
  const openList = (ordered: boolean) => {
    closeList();
    listEl = document.createElement(ordered ? 'ol' : 'ul');
    listOrdered = ordered;
    container.appendChild(listEl);
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Fenced code blocks
    if (trimmed.startsWith('```')) {
      if (inCode) {
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = codeBuf.join('\n');
        pre.appendChild(code);
        container.appendChild(pre);
        codeBuf = [];
        inCode = false;
        closeList();
      } else {
        inCode = true;
        codeBuf = [];
        closeList();
      }
      i++;
      continue;
    }
    if (inCode) { codeBuf.push(raw); i++; continue; }

    if (!trimmed) { closeList(); i++; continue; }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { container.appendChild(document.createElement('hr')); closeList(); i++; continue; }

    // Headings
    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const level = Math.min(h[1].length, 4);
      const el = document.createElement('h' + level);
      renderInline(el, h[2]);
      container.appendChild(el);
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      closeList();
      const bq = document.createElement('blockquote');
      renderInline(bq, trimmed.replace(/^>\s?/, ''));
      container.appendChild(bq);
      i++;
      continue;
    }

    // Ordered list item
    const ol = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (ol) {
      if (!listEl || !listOrdered) openList(true);
      const li = document.createElement('li');
      renderInline(li, ol[2]);
      listEl!.appendChild(li);
      i++;
      continue;
    }

    // Unordered list item
    const ul = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ul) {
      if (!listEl || listOrdered) openList(false);
      const li = document.createElement('li');
      renderInline(li, ul[1]);
      listEl!.appendChild(li);
      i++;
      continue;
    }

    // Table: a line whose cells are delimited by pipes, followed by a separator row.
    if (trimmed.includes('|')) {
      const next = i + 1 < lines.length ? lines[i + 1].trim() : '';
      const isTable = trimmed.startsWith('|') && next.includes('|') && /^\|?[\s:|-]+\|?$/.test(next);
      if (isTable) {
        closeList();
        const parseRow = (r: string) => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        const head = parseRow(trimmed);
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const hrRow = document.createElement('tr');
        head.forEach((c) => { const th = document.createElement('th'); renderInline(th, c); hrRow.appendChild(th); });
        thead.appendChild(hrRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        i += 2; // skip separator row
        while (i < lines.length && lines[i].trim().includes('|')) {
          const tr = document.createElement('tr');
          parseRow(lines[i].trim()).forEach((c) => { const td = document.createElement('td'); renderInline(td, c); tr.appendChild(td); });
          tbody.appendChild(tr);
          i++;
        }
        table.appendChild(tbody);
        container.appendChild(table);
        continue;
      }
    }

    // Paragraph
    closeList();
    const p = document.createElement('p');
    renderInline(p, trimmed);
    container.appendChild(p);
    i++;
  }
  if (inCode && codeBuf.length) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = codeBuf.join('\n');
    pre.appendChild(code);
    container.appendChild(pre);
  }
}

export function initAgentChat(signal: AbortSignal) {
  const host = document.querySelector<HTMLElement>('[data-agent-chat]');
  if (!host || host.dataset.initialized === 'true') return;
  host.dataset.initialized = 'true';
  const lang = host.dataset.lang === 'en' ? 'en' : 'zh-CN';
  const zh = lang === 'zh-CN';
  const list = host.querySelector<HTMLElement>('[data-messages]')!;
  const form = host.querySelector<HTMLFormElement>('[data-agent-form]')!;
  const input = host.querySelector<HTMLTextAreaElement>('[data-agent-input]')!;
  const status = host.querySelector<HTMLElement>('[data-agent-status]')!;
  const send = host.querySelector<HTMLButtonElement>('[data-agent-send]')!;
  const stop = host.querySelector<HTMLButtonElement>('[data-agent-stop]')!;
  const suggestions = host.querySelector<HTMLElement>('[data-suggestions]')!;
  let conversationId = getConversationId(lang);
  let active: AbortController | null = null;
  const initialMarkup = list.innerHTML;
  const scroll = () => { list.scrollTop = list.scrollHeight; };
  const append = (role: ChatRole, content: string) => {
    const message = document.createElement('div');
    message.className = `agent-message agent-message-${role}`;
    renderText(message, content);
    list.append(message);
    scroll();
    return message;
  };
  const setBusy = (busy: boolean) => {
    input.disabled = busy;
    send.disabled = busy;
    stop.hidden = !busy;
    suggestions.hidden = busy || list.children.length > 1;
  };
  signal.addEventListener('abort', () => active?.abort(), { once: true });
  const restore = async () => {
    const restoringId = conversationId;
    try {
      const response = await fetch('/agent-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Makers-Conversation-Id': conversationId },
        body: '{}', signal,
      });
      if (!response.ok) return;
      const data = await response.json() as { messages?: HistoryItem[] };
      if (signal.aborted || active || list.children.length > 1 || restoringId !== conversationId || !Array.isArray(data.messages) || !data.messages.length) return;
      list.replaceChildren();
      data.messages.forEach((m) => {
        if ((m.role === 'assistant' || m.role === 'user') && typeof m.content === 'string') append(m.role, m.content);
      });
      suggestions.hidden = true;
    } catch { /* First visit, or offline/static preview: keep welcome message. */ }
  };
  void restore();
  const ask = async (text: string) => {
    if (active || !text.trim() || signal.aborted) return;
    active = new AbortController();
    const controller = active;
    setBusy(true);
    append('user', text);
    const output = append('assistant', zh ? '正在思考…' : 'Thinking…');
    let answer = '';
    let finished = false;
    status.textContent = zh ? '正在连接 Agent…' : 'Connecting to agent…';
    try {
      const response = await fetch('/site-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Makers-Conversation-Id': conversationId },
        body: JSON.stringify({ message: text, lang }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const messages: Record<number, string> = zh
          ? { 429: '请求过于频繁，请稍后再试。', 503: 'Agent 尚未启用，请站长配置模型密钥和访问开关。' }
          : { 429: 'Too many requests. Try again later.', 503: 'Agent is not enabled. The site owner must configure the model.' };
        throw new Error(messages[response.status] || `HTTP ${response.status}`);
      }
      if (!response.body) throw new Error('Streaming is not supported.');
      status.textContent = zh ? '正在回答…' : 'Responding…';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const applyFrame = (frame: Frame | null) => {
        if (!frame) return;
        if (frame.event === 'text_delta' && typeof frame.data.delta === 'string') {
          answer += frame.data.delta;
          renderText(output, answer);
          scroll();
        } else if (frame.event === 'tool_called') {
          status.textContent = zh ? '正在查询网站内容…' : 'Searching site content…';
        } else if (frame.event === 'error') {
          throw new Error(zh ? 'Agent 生成回答失败，请稍后重试。' : 'The agent failed to respond.');
        } else if (frame.event === 'done') {
          finished = true;
        }
      };
      while (!finished && !signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) applyFrame(toFrames(part));
      }
      if (buffer.trim()) applyFrame(toFrames(buffer));
      if (!answer) renderText(output, zh ? '没有收到回复，请重试。' : 'No reply received. Please retry.');
    } catch (err) {
      const aborted = controller.signal.aborted || signal.aborted;
      renderText(output, aborted ? (zh ? '已停止。' : 'Stopped.') : (err instanceof Error ? err.message : String(err)));
    } finally {
      if (active === controller) active = null;
      if (!signal.aborted) {
        setBusy(false);
        status.textContent = zh ? '只检索公开内容' : 'Public content only';
        input.focus();
      }
    }
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    void ask(text);
  }, { signal });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault(); form.requestSubmit();
    }
  }, { signal });
  suggestions.querySelectorAll<HTMLButtonElement>('[data-suggest]').forEach((button) => {
    button.addEventListener('click', () => { void ask(button.dataset.suggest || ''); }, { signal });
  });
  stop.addEventListener('click', () => active?.abort(), { signal });
  host.querySelector<HTMLButtonElement>('[data-new-chat]')?.addEventListener('click', () => {
    active?.abort();
    conversationId = newConversationId();
    try { localStorage.setItem(keyFor(lang), conversationId); } catch { /* optional */ }
    list.innerHTML = initialMarkup;
    suggestions.hidden = false;
    status.textContent = zh ? '已开始新对话' : 'New conversation started';
    input.focus();
  }, { signal });
}
