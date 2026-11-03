/**
 * Read-only maintenance log for the site owner.
 *
 * Returns the questions visitors asked the site assistant (and the answers it
 * gave) so the owner can see which topics are missing or answered poorly, and
 * improve the content or the assistant instructions.
 *
 * Access requires the `x-log-token` header to match the AGENT_LOG_TOKEN
 * environment variable. Without a configured token the endpoint stays closed.
 *
 * Usage:
 *   curl -H "x-log-token: <token>" https://edgeone.chenfukun.space/agent-log
 */
type CloudContext = {
  request: Request;
  env?: Record<string, string | undefined>;
  agent?: {
    store: {
      getMessages: (arg: { conversationId: string; order: 'desc'; limit: number }) => Promise<Array<{ role?: string; content?: unknown; metadata?: Record<string, unknown> }>>;
      clearMessages: (arg: { conversationId: string }) => Promise<unknown>;
    };
  };
};

// Must stay in sync with agents/site-assistant/index.ts. The platform only
// accepts conversation ids shaped as `c_` + 32 hex characters.
const LOG_CONVERSATION_ID = 'c_5a1e7b0c4d2f8a3e6b9c0d1f2e3a4b5c';
const LOG_SOURCE = 'site-agent-log-v1';
const FEEDBACK_SOURCE = 'site-agent-feedback-v1';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export async function onRequestGet(context: CloudContext) {
  const expected = context.env?.AGENT_LOG_TOKEN || '';
  const provided = context.request.headers.get('x-log-token') || '';
  if (!expected || provided !== expected) {
    return json({ error: 'Unauthorized' }, 401);
  }
  try {
    // The platform getMessages limit range is [1,100]; values above throw
    // MemoryValidationError. 100 is the page size; paginate with cursor if more
    // history is ever needed.
    const items = await context.agent?.store.getMessages({ conversationId: LOG_CONVERSATION_ID, order: 'desc', limit: 100 }) || [];
    const entries = items
      .filter((item) => item.metadata?.source === LOG_SOURCE && typeof item.content === 'string')
      .map((item) => ({
        role: item.role === 'assistant' ? 'answer' : 'question',
        lang: typeof item.metadata?.lang === 'string' ? item.metadata.lang : null,
        at: typeof item.metadata?.at === 'string' ? item.metadata.at : null,
        sid: typeof item.metadata?.sid === 'string' ? item.metadata.sid : null,
        text: item.content,
      }))
      .reverse();

    // Group entries into anonymous session threads so the owner can follow a
    // single visitor's multi-turn flow. The sid is a one-way hash, never a real
    // conversation id. Sessions are ordered by their first message time.
    const threads: Array<{ sid: string; startedAt: string | null; turns: number; entries: typeof entries }> = [];
    const bySid = new Map<string, typeof entries>();
    for (const entry of entries) {
      const key = entry.sid || 'unknown';
      if (!bySid.has(key)) bySid.set(key, []);
      bySid.get(key)!.push(entry);
    }
    for (const [sid, list] of Array.from(bySid.entries())) {
      const turns = list.filter((e) => e.role === 'question').length;
      threads.push({ sid, startedAt: list[0]?.at ?? null, turns, entries: list });
    }
    threads.sort((a, b) => (a.startedAt ?? '').localeCompare(b.startedAt ?? ''));

    // Owner-only feedback: visitor suggestions (with any contact they left) and
    // the assistant's own improvement notes. Tagged by `kind`, ordered oldest-first.
    const feedback = items
      .filter((item) => item.metadata?.source === FEEDBACK_SOURCE && typeof item.content === 'string')
      .map((item) => ({
        kind: item.metadata?.kind === 'visitor-feedback' ? 'visitor-feedback' : 'ai-insight',
        lang: typeof item.metadata?.lang === 'string' ? item.metadata.lang : null,
        at: typeof item.metadata?.at === 'string' ? item.metadata.at : null,
        sid: typeof item.metadata?.sid === 'string' ? item.metadata.sid : null,
        contact: typeof item.metadata?.contact === 'string' ? item.metadata.contact : null,
        text: item.content,
      }))
      .reverse();

    // `raw` is the unfiltered message count of the log conversation; it helps
    // tell "nothing was written" apart from "written but filtered out".
    return json({ count: entries.length, raw: items.length, sessions: threads.length, threads, entries, feedback });
  } catch (err) {
    // This endpoint is owner-only (token-protected), so surfacing the read
    // error type here is safe and makes storage failures debuggable.
    return json({ error: 'Log read failed', detail: String((err as Error)?.name || err).slice(0, 120) }, 500);
  }
}

/**
 * Owner-only: clear the whole maintenance log (questions, answers and feedback).
 * Token-protected the same way as the read path. Destructive and not reversible,
 * so it requires an explicit DELETE request — never triggered by normal browsing.
 */
export async function onRequestDelete(context: CloudContext) {
  const expected = context.env?.AGENT_LOG_TOKEN || '';
  const provided = context.request.headers.get('x-log-token') || '';
  if (!expected || provided !== expected) {
    return json({ error: 'Unauthorized' }, 401);
  }
  try {
    await context.agent?.store.clearMessages({ conversationId: LOG_CONVERSATION_ID });
    return json({ ok: true, cleared: true });
  } catch (err) {
    return json({ error: 'Clear failed', detail: String((err as Error)?.name || err).slice(0, 120) }, 500);
  }
}
