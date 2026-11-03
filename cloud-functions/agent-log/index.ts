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
    };
  };
};

const LOG_CONVERSATION_ID = 'site-owner-maintenance-log';
const LOG_SOURCE = 'site-agent-log-v1';

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
    const items = await context.agent?.store.getMessages({ conversationId: LOG_CONVERSATION_ID, order: 'desc', limit: 200 }) || [];
    const entries = items
      .filter((item) => item.metadata?.source === LOG_SOURCE && typeof item.content === 'string')
      .map((item) => ({
        role: item.role === 'assistant' ? 'answer' : 'question',
        lang: typeof item.metadata?.lang === 'string' ? item.metadata.lang : null,
        at: typeof item.metadata?.at === 'string' ? item.metadata.at : null,
        text: item.content,
      }))
      .reverse();
    return json({ count: entries.length, entries });
  } catch {
    return json({ count: 0, entries: [] });
  }
}
