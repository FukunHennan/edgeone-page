---
title: Streaming chat agent on EdgeOne Makers with the OpenAI Agents SDK
description: Engineering notes on a streaming chat agent built with the OpenAI Agents SDK on EdgeOne Makers, covering SSE streaming, custom tool registration, conversation persistence, and state layering.
date: 2026-09-14 10:00:00
updated: 2026-09-14 10:00:00
lang: en
translation_key: openai-agents-starter-python
published: true
categories:
  - Engineering
tags:
  - OpenAI Agents
  - EdgeOne Makers
  - Streaming Chat
  - SSE
  - Python
---

Shipping a conversational AI to production is not about "can I call the API"; it is about streaming, tool calls, conversation memory, and cancellation working together in one engineering structure. This post records a streaming chat agent built with the OpenAI Agents SDK on EdgeOne Makers. Repo: [FukunHennan/openai-agents-starter-python](https://github.com/FukunHennan/openai-agents-starter-python).

## What this is

A minimal production-shaped Python starter that wires the OpenAI Agents SDK into EdgeOne Makers, demonstrating the full chat loop: SSE streaming, custom tool registration, conversation persistence. It ships four sample tools (`get_weather`, `get_clothing_advice`, `translate_text`, `text_statistics`) so you can fork and replace them with real ones.

## SSE streaming: more than token-by-token

SSE looks like splitting a one-shot response into tokens. Engineering-wise you handle three event types:

- `text_delta`: model text increment, pushed to the frontend token by token;
- `tool_called`: emitted when the model invokes a tool;
- `tool_result`: tool execution result sent back to the frontend.

Only `text_delta` feels like "AI talking to itself"; adding `tool_called` and `tool_result` makes "AI is calling tools to solve the problem" visible — a big UX upgrade.

## Custom tools: from toy to production

The four sample tools are toys: fixed weather, basic clothing advice, simple translation, text statistics. When replacing them, the engineering points are: clear type annotations on signatures so the SDK generates correct JSON Schema; in-tool exception handling so one failure does not poison the conversation; observable side effects (log when writing to a database, etc.).

## Conversation memory via context.store

Persistence goes through `context.store.openai_session(cid)`, which plugs straight into `Runner.run_streamed()`'s `session` parameter. OpenAI maintains the context; you do not roll your own history window.

`cid` is the conversation ID, passed in via HTTP. Same `cid` shares a session across requests. Horizontal scaling is straightforward: as long as `context.store` is shared (Redis, a database), any instance can serve the same conversation.

## State layering: agents and cloud-functions

The starter's two folders encode a state boundary:

- `agents/`: long-running stateful work — `chat/index.py` streaming and `chat/stop.py` abort;
- `cloud-functions/`: short, stateless work — `history/index.py` loading messages.

State lifetime matches code location; when you add features, the layer is obvious. Dumping everything in one folder blurs state boundaries and hurts later distributed deployments.

## Real cancellation: abort_active_run

Many "cancel" buttons just stop rendering on the frontend while the backend keeps burning tokens. `context.utils.abort_active_run()` actually interrupts the LLM call, saving tokens and compute.

Engineering-wise: frontend fires `POST /chat/stop`; backend locates the active Runner by cid; calls the SDK abort API; frontend gets an SSE close event and cleans up.

## Environment and model choice

The starter uses the OpenAI-compatible protocol via three env vars:

- `AI_GATEWAY_API_KEY`: model gateway API key (Makers Models key or any OpenAI-compatible provider);
- `AI_GATEWAY_BASE_URL`: gateway base URL (`https://ai-gateway.edgeone.link/v1` for Makers Models);
- `AI_GATEWAY_MODEL`: model ID, defaults to `@makers/deepseek-v4-flash` (free built-in).

The built-in `@makers/deepseek-v4-flash` has a usage cap, good for prototyping. For production, BYOK (Bring Your Own Key) with a paid provider is recommended for stability and compliance.

## Local dev

Prerequisites: Node.js ≥ 18, Python ≥ 3.10, EdgeOne CLI (`npm i -g edgeone`).

```bash
npm install
pip install -r requirements.txt
cp .env.example .env       # fill AI_GATEWAY_API_KEY / AI_GATEWAY_BASE_URL
edgeone makers dev
```

Local agent metrics and traces are at `http://localhost:8080/agent-metrics`, useful for prompt and tool tuning.

## Frontend

React + Vite + TypeScript. Core pieces: `App.tsx` (main app and SSE lifecycle), `api.ts` (`/chat`, `/chat/stop`, `/history` wrappers), `components/` (ChatWindow, ChatInput, CodeViewer, ToolIndicators, …).

SSE lifecycle is the most bug-prone area: open, stream, error-reconnect, cancel-close — every transition must be state-correct. The starter keeps this in `App.tsx` as a reference implementation for similar projects.

## Closing notes

The OpenAI Agents SDK lowers the bar for conversational AI engineering, but production still needs streaming, tool calls, persistence, and real cancellation. This starter pulls them together into a minimal production-shaped template, suitable as an engineering starting point. Swap the toy tools for real ones and it is product-ready.
