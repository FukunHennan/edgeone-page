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

function renderText(container: HTMLElement, text: string) {
  container.replaceChildren();
  // Only turn safe absolute site URLs into links. No HTML from the model is inserted.
  const re = /https:\/\/edgeone\.chenfukun\.space\/(?:zh-CN|en)\/[\w%./?&=#-]*/g;
  let last = 0;
  for (const match of text.matchAll(re)) {
    const at = match.index ?? 0;
    container.append(document.createTextNode(text.slice(last, at)));
    const anchor = document.createElement('a');
    anchor.href = match[0];
    anchor.textContent = match[0];
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    container.append(anchor);
    last = at + match[0].length;
  }
  container.append(document.createTextNode(text.slice(last)));
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
      if (signal.aborted || restoringId !== conversationId || !Array.isArray(data.messages) || !data.messages.length) return;
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
