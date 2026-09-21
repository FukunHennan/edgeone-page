---
title: 用 OpenAI Agents SDK 在 EdgeOne Makers 上搭建流式对话 Agent
description: 记录一次使用 OpenAI Agents SDK 在 EdgeOne Makers 上搭建流式对话 Agent 的工程实践，重点说明 SSE 流式输出、自定义工具注册、会话持久化与状态分层设计。
date: 2026-09-14 10:00:00
updated: 2026-09-14 10:00:00
lang: zh-CN
translation_key: openai-agents-starter-python
published: true
categories:
  - 工程实践
tags:
  - OpenAI Agents
  - EdgeOne Makers
  - 流式对话
  - SSE
  - Python
---

把一个对话式 AI 上线到生产环境，挑战不在于"能否调通 API"，而在于流式输出、工具调用、会话记忆和异常取消能否在一个工程结构里协同。本文记录用 OpenAI Agents SDK 在 EdgeOne Makers 上搭建流式对话 Agent 的实践。仓库地址：[FukunHennan/openai-agents-starter-python](https://github.com/FukunHennan/openai-agents-starter-python)。

## 项目定位

这个 Starter 是一个最小可生产形态的 Python 模板，把 OpenAI Agents SDK 接入 EdgeOne Makers，演示完整的对话闭环：SSE 流式输出、自定义工具注册、会话持久化。它附带四个示例工具（`get_weather`、`get_clothing_advice`、`translate_text`、`text_statistics`），意图是让你 fork 后替换成真实业务工具。

## SSE 流式输出：不只是 token-by-token

SSE 流式输出看起来只是把一次性响应拆成 token 流，实际工程上要处理三种事件：

- `text_delta`：模型输出的文本增量，逐 token 推送到前端；
- `tool_called`：模型调用工具时的事件，前端显示工具调用过程；
- `tool_result`：工具执行结果返回给前端，便于展示中间状态。

只输出 `text_delta` 会让用户感觉"AI 在自言自语"，加上 `tool_called` 和 `tool_result` 后用户能感知到"AI 在调用工具解决问题"，体验差异显著。

## 自定义工具：从 toy 到 production

Starter 自带的四个工具是 toy：

- `get_weather(city)`：返回固定天气数据；
- `get_clothing_advice(temperature)`：根据温度返回穿搭建议；
- `translate_text(text, target_lang)`：简单翻译；
- `text_statistics(text)`：统计字符数、单词数。

把它们替换为真实工具时，工程要点是：工具签名要明确类型注解，便于 SDK 自动生成 JSON Schema；工具内部要做异常兜底，不要让一次失败影响整个对话；工具副作用要可观察，例如写入数据库时同时输出日志。

## 会话记忆与 context.store

会话持久化通过 `context.store.openai_session(cid)` 接入，它会直接插入到 `Runner.run_streamed()` 的 `session` 参数。这意味着对话上下文由 OpenAI 维护，不需要自己实现历史窗口。

`cid` 是对话 ID，通过 HTTP 请求传入。同一个 cid 的请求共享一个 session，跨请求保持上下文。这种设计让水平扩展变得简单：只要 `context.store` 是共享存储（Redis、数据库），不同实例都能服务同一个对话。

## 状态分层：agents 与 cloud-functions

Starter 的目录结构把代码分成两个文件夹，这反映了状态分层的设计：

- `agents/`：长时间运行的有状态工作，主要是 `chat/index.py` 的流式对话和 `chat/stop.py` 的取消；
- `cloud-functions/`：短时无状态工作，例如 `history/index.py` 加载历史消息。

这种分层的好处是：状态生命周期与代码位置一致，便于扩展时判断新功能应该放哪一层。如果所有代码都堆在一个目录，状态边界会模糊，迁移到分布式环境时会踩坑。

## 真正的取消：abort_active_run

很多"取消"按钮实际只是前端不再渲染，后端仍在跑。这个 Starter 的 `context.utils.abort_active_run()` 是真正中断 LLM 调用，避免浪费 token 和算力。

工程上，取消要做到：前端触发 `POST /chat/stop`；后端找到对应 cid 的活跃 Runner；调用 SDK 提供的 abort 接口；前端收到 SSE 关闭事件后清理状态。

## 环境变量与模型选择

Starter 使用 OpenAI 兼容协议，通过三个环境变量配置：

- `AI_GATEWAY_API_KEY`：模型网关 API Key，可用 Makers Models 的 Key 或任意 OpenAI 兼容服务商的 Key；
- `AI_GATEWAY_BASE_URL`：网关 base URL，Makers Models 用 `https://ai-gateway.edgeone.link/v1`；
- `AI_GATEWAY_MODEL`：模型 ID，默认 `@makers/deepseek-v4-flash`（免费内置模型）。

内置的 `@makers/deepseek-v4-flash` 有用量上限，适合原型阶段。生产环境建议 BYOK（Bring Your Own Key），绑定付费服务商以保证稳定性和合规性。

## 本地开发与调试

本地开发前置依赖：Node.js ≥ 18、Python ≥ 3.10、EdgeOne CLI（`npm i -g edgeone`）。流程：

```bash
npm install
pip install -r requirements.txt
cp .env.example .env       # 填入 AI_GATEWAY_API_KEY / AI_GATEWAY_BASE_URL
edgeone makers dev
```

本地 agent metrics 和 traces 暴露在 `http://localhost:8080/agent-metrics`，可以实时查看 token 消耗、工具调用次数、响应延迟。这个面板在调优 prompt 和工具时非常实用。

## 前端结构

前端是 React + Vite + TypeScript，核心组件包括 `App.tsx`（主应用与 SSE 生命周期）、`api.ts`（`/chat`、`/chat/stop`、`/history` 调用封装）、`components/`（ChatWindow、ChatInput、CodeViewer、ToolIndicators 等）。

SSE 生命周期管理是前端最容易出 bug 的地方：连接建立、流式接收、异常重连、取消关闭，每一步都要状态正确。Starter 把这些封装在 `App.tsx` 里，可作为类似项目的参考实现。

## 小结

OpenAI Agents SDK 把对话 AI 工程化的门槛显著降低，但要上生产仍需处理流式输出、工具调用、会话持久化和真正取消。这个 Starter 把这些环节整合成一个最小可生产形态，可以作为对话式 AI 项目的工程起点。替换 toy 工具为真实业务工具后，即可用于实际产品。
