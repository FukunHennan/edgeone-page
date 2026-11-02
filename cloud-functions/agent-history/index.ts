/**
 * Read-only chat history for a single unguessable browser-generated
 * conversation ID. Only messages explicitly marked by this site agent appear.
 */
type CloudContext = {
  request: Request;
  agent?: {
    store: {
      getMessages: (arg: { conversationId: string; order: 'desc'; limit: number }) => Promise<Array<{ role?: string; content?: unknown; metadata?: Record<string, unknown> }>>;
    };
  };
};

export async function onRequestPost(context: CloudContext) {
  const cid = context.request.headers.get('makers-conversation-id') || '';
  if (!/^c_[a-f0-9]{32}$/.test(cid)) {
    return new Response(JSON.stringify({ messages: [] }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const items = await context.agent?.store.getMessages({ conversationId: cid, order: 'desc', limit: 100 }) || [];
    const messages = items.filter((item) =>
      item.metadata?.source === 'site-agent-v1' &&
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string'
    ).reverse().slice(-40).map((item) => ({ role: item.role, content: item.content }));
    return new Response(JSON.stringify({ messages }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response(JSON.stringify({ messages: [] }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
